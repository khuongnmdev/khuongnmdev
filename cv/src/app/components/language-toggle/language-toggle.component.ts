import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  inject,
  Injector,
  linkedSignal,
  PLATFORM_ID,
  Renderer2,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationStart,
  PRIMARY_OUTLET,
  Router,
  RouterLink,
  UrlTree,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { localizedCommands, splitLocalePrefix } from '@core/i18n/localized-url';
import { SUPPORTED_LOCALES, type Locale } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';

/** A switch has two sides: the first language on the left, the second on the right. */
const [START, END] = SUPPORTED_LOCALES;

/**
 * The longest a click waits for the slide before navigating anyway: a little
 * over the stylesheet's 0.2s transition, which a hidden tab or a paused
 * timeline would otherwise hold back indefinitely.
 */
const SLIDE_TIMEOUT_MS = 350;

/**
 * EN / VI slide switch. It is one real link to the page being viewed in the
 * other language — `/` ↔ `/vi`, `/print?template=compact` ↔
 * `/vi/print?template=compact` — so the choice travels in the URL: it can be
 * bookmarked, shared, and crawled, and it needs no stored preference.
 *
 * The page is rebuilt when the language changes, so a transition started
 * after the navigation would never be seen. A plain click therefore slides
 * the thumb first and navigates once the slide has finished; the new page
 * then renders with the thumb already on its side. Any other click — with a
 * modifier, or another button — is left to the browser, which opens the
 * link's href wherever the visitor asked.
 */
@Component({
  selector: 'app-language-toggle',
  imports: [RouterLink],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {
  private readonly router = inject(Router);
  private readonly cvData = inject(CvDataService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly ui = this.cvData.ui;

  /** The visible codes, in the order of the switch's two sides. */
  protected readonly codes = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: locale.toUpperCase(),
  }));

  /** The language the link leads to: the one not being viewed. */
  protected readonly other = computed<Locale>(() =>
    this.cvData.language() === START ? END : START,
  );

  /**
   * The language under the thumb. It follows the page's language, and moves
   * ahead of it for the length of the slide a click starts.
   */
  protected readonly thumb = linkedSignal<Locale>(() => this.cvData.language());
  protected readonly thumbAtEnd = computed(() => this.thumb() === END);

  /**
   * Set by the first click that starts a switch. Transitions only apply
   * while it is set, so the first render, a hydration, or a theme change
   * never animates anything.
   */
  protected readonly sliding = signal(false);

  /** Guards against a second click starting a second navigation mid-slide. */
  private switching = false;

  /** Id of the latest navigation to start, so a switch can tell if another began. */
  private readonly lastNavigationStart = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart),
      map((event) => event.id),
    ),
    { initialValue: 0 },
  );

  /** The current URL, refreshed after every navigation (query changes included). */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** The page being viewed, in the other language, query and fragment kept. */
  protected readonly target = computed<UrlTree>(() => {
    const current = this.router.parseUrl(this.url());
    const segments = (current.root.children[PRIMARY_OUTLET]?.segments ?? []).map(
      (segment) => segment.path,
    );
    return this.router.createUrlTree(
      localizedCommands(this.other(), splitLocalePrefix(segments).segments),
      { queryParams: current.queryParams, fragment: current.fragment ?? undefined },
    );
  });

  /** Tooltip and accessible name, in the language of the page being viewed. */
  protected readonly name = computed(() => this.ui().viewInLanguage[this.other()]);

  constructor() {
    // Clicks only happen in the browser; the prerendered link needs no listener.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      // The capture phase on the host sees a click before the link does, and
      // with it before the router directive that would navigate at once.
      const unlisten = inject(Renderer2).listen(
        this.host,
        'click',
        (event: MouseEvent) => this.onClick(event),
        { capture: true },
      );
      this.destroyRef.onDestroy(unlisten);
    }
  }

  private onClick(event: MouseEvent): void {
    // New tab, new window, download: the browser follows the href itself,
    // and nothing here moves.
    if (event.button !== 0 || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }
    // This listener navigates instead of the router directive, so the click
    // stops here; otherwise the page would change before the thumb moves.
    // Ancestors never see a plain click on the switch: a listener on the
    // document will not hear it.
    event.preventDefault();
    event.stopPropagation();
    if (this.switching) {
      return;
    }
    this.switching = true;
    const target = this.target();
    const navigationAtClick = this.lastNavigationStart();
    this.sliding.set(true);
    this.thumb.set(this.other());
    afterNextRender(
      { read: () => void this.navigateAfterSlide(target, navigationAtClick) },
      { injector: this.injector },
    );
  }

  private async navigateAfterSlide(target: UrlTree, navigationAtClick: number): Promise<void> {
    await this.slideEnd();
    // Gone with its page (a Back link, the browser's Back button): the
    // visitor went elsewhere, and a late switch must not pull them back.
    if (this.destroyRef.destroyed) {
      return;
    }
    // Another navigation began during the slide while this page stayed: a
    // query change here, or a lazily loaded page still on its way. The later
    // choice wins, as it does between any two links, and the thumb goes back.
    if (this.lastNavigationStart() !== navigationAtClick) {
      this.thumb.set(this.cvData.language());
      this.switching = false;
      return;
    }
    try {
      if (!(await this.router.navigateByUrl(target))) {
        this.thumb.set(this.cvData.language());
      }
    } catch (error) {
      // The page stays in its language, and so does the thumb.
      this.thumb.set(this.cvData.language());
      this.errorHandler.handleError(error);
    } finally {
      this.switching = false;
    }
  }

  /**
   * Settles when the thumb's transition ends or is cancelled, or after
   * `SLIDE_TIMEOUT_MS`, whichever comes first. Read after the render that
   * moved the thumb, so the transition has started. There is none under
   * `prefers-reduced-motion: reduce`, and no Web Animations API in some
   * environments; it then settles at once.
   */
  private slideEnd(): Promise<void> {
    const slide = this.host.querySelector('.lang-thumb')?.getAnimations?.() ?? [];
    if (slide.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, SLIDE_TIMEOUT_MS);
      void Promise.allSettled(slide.map((animation) => animation.finished)).then(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
