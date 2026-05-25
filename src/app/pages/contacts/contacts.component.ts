import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-contacts',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent {
  protected readonly contactItems = [
    { iconName: 'mail',  labelKey: 'contactEmail',    value: 'contact@arlenfluffyplush.com', href: 'mailto:contact@arlenfluffyplush.com', tint: 'purple' },
    { iconName: 'phone', labelKey: 'contactPhone',    value: '+1 (555) 123-4567',            href: 'tel:+15551234567',                   tint: 'blue'   },
    { iconName: 'map',   labelKey: 'contactLocation', value: 'Los Angeles, California',      href: null,                                  tint: 'green'  },
  ] as const;

  protected readonly socialLinks = [
    { iconName: 'instagram', name: 'Instagram', handle: '@arlenfluffyplush', url: 'https://instagram.com/arlenfluffyplush', accent: 'pink'  },
    { iconName: 'youtube',   name: 'YouTube',   handle: 'Arlen Fluffy Plush', url: 'https://youtube.com/@arlenfluffyplush',  accent: 'red'   },
    { iconName: 'telegram',  name: 'Telegram',  handle: '@arlenfluffyplush', url: 'https://t.me/arlenfluffyplush',           accent: 'blue'  },
  ] as const;

  protected readonly partners = [
    { id: 'cfa',  name: 'CFA',  website: 'https://cfa.org'       },
    { id: 'tica', name: 'TICA', website: 'https://tica.org'      },
    { id: 'gccf', name: 'GCCF', website: 'https://gccfcats.org'  },
    { id: 'wcf',  name: 'WCF',  website: 'https://wcf-online.de' },
  ] as const;
}
