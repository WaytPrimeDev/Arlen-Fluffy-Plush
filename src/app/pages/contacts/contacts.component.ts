import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-contacts',
  imports: [TranslatePipe],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent {
  protected readonly contactItems = [
    { iconName: 'mail',  labelKey: 'contactEmail',    value: 'arlen.fluffy.plush@gmail.com', href: 'mailto:arlen.fluffy.plush@gmail.com', tint: 'purple' },
    { iconName: 'phone', labelKey: 'contactPhone',    value: '+380933814571',            href: 'tel:+380933814571',                   tint: 'blue'   },
    { iconName: 'map',   labelKey: 'contactLocation', value: 'Ternopil, Ukraine',      href: null,                                  tint: 'green'  },
  ] as const;

  protected readonly socialLinks = [
    { iconName: 'instagram', name: 'Instagram', handle: '@arlenfluffyplush', url: 'https://www.instagram.com/natalya.turusheva_1?rpxt=MWhhYTk3ZG14OGxkNw==', accent: 'pink'  },
    { iconName: 'tiktok',    name: 'TikTok',   handle: 'Arlen Fluffy Plush', url: 'https://www.tiktok.com/@natalyaturusheva?_r=1&_t=ZS-9Abh7xgxHbp',  accent: 'red'   },
    { iconName: 'telegram',  name: 'Telegram',  handle: '@arlenfluffyplush', url: 'https://t.me/kittensarlenfluffyplush',           accent: 'blue'  },
  ] as const;

  protected readonly partners = [
    { id: 'cfa',  name: 'CFA',  website: 'https://cfa.org'       },
    { id: 'tica', name: 'TICA', website: 'https://tica.org'      },
    { id: 'gccf', name: 'GCCF', website: 'https://gccfcats.org'  },
    { id: 'wcf',  name: 'WCF',  website: 'https://wcf-online.de' },
  ] as const;
}
