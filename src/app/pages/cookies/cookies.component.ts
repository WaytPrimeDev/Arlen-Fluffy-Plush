import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { SITE } from '../../services/site-config';

/** One row of the table of cookies the site actually sets. */
interface CookieRow {
  /** The cookie's own name, as the browser's storage inspector shows it. */
  name: string;
  groupKey: string;
  purposeKey: string;
  lifetimeKey: string;
}

/**
 * The cookie policy. Static copy, so everything on it comes from the
 * translation catalogue and the site config — the e-mail is the one published
 * on the contacts page rather than a second address only this page knows.
 *
 * The table lists the cookies the site really sets: the two of its own, and
 * the Google Analytics ones the tag manager container writes. Keeping it to
 * what is observable in the browser's own storage inspector is the point —
 * a policy that lists cookies the site does not set is as wrong as one that
 * omits cookies it does.
 *
 * The page also carries the consent controls themselves, because a policy that
 * can only tell a visitor to clear their browser data does not give them a way
 * to withdraw consent — and under the GDPR withdrawing has to be as easy as
 * giving it. The two buttons call the same service the notice at the bottom of
 * the page does, so there is one record of the decision and not two.
 */
@Component({
  selector: 'app-cookies',
  imports: [TranslatePipe],
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesComponent {
  protected readonly consent = inject(CookieConsentService);

  protected readonly email = SITE.email;
  protected readonly telegram = SITE.telegram;

  /** The sentence describing what is on record right now. */
  protected readonly stateKey = computed(() => {
    const decision = this.consent.decision$();
    if (decision === 'accepted') {
      return 'cookiesConsentStateAccepted';
    }

    return decision === 'declined'
      ? 'cookiesConsentStateDeclined'
      : 'cookiesConsentStateUnanswered';
  });

  /**
   * Taking back a consent already given is a withdrawal and says so; refusing
   * one that was never given is just a refusal. Same operation either way.
   */
  protected readonly declineKey = computed(() =>
    this.consent.decision$() === 'accepted' ? 'cookiesConsentWithdraw' : 'cookiesConsentDecline',
  );

  protected readonly rows: readonly CookieRow[] = [
    {
      name: 'language',
      groupKey: 'cookiesGroupNecessary',
      purposeKey: 'cookieLanguagePurpose',
      lifetimeKey: 'cookieLife1Year',
    },
    {
      name: 'cookie_consent',
      groupKey: 'cookiesGroupNecessary',
      purposeKey: 'cookieConsentPurpose',
      lifetimeKey: 'cookieLife1Year',
    },
    {
      name: '_ga',
      groupKey: 'cookiesGroupAnalytics',
      purposeKey: 'cookieGaPurpose',
      lifetimeKey: 'cookieLife2Years',
    },
    {
      name: '_ga_*',
      groupKey: 'cookiesGroupAnalytics',
      purposeKey: 'cookieGaSessionPurpose',
      lifetimeKey: 'cookieLife2Years',
    },
    {
      name: '_gid',
      groupKey: 'cookiesGroupAnalytics',
      purposeKey: 'cookieGidPurpose',
      lifetimeKey: 'cookieLife24Hours',
    },
  ];

  protected readonly manageItemKeys: readonly string[] = [
    'cookiesManageChrome',
    'cookiesManageSafari',
    'cookiesManageFirefox',
    'cookiesManageEdge',
  ];
}
