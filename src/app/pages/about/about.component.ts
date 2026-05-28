import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Milestone {
  year: string;
  titleKey: string;
  descriptionKey: string;
}

interface Value {
  iconName: 'heart' | 'target' | 'trophy';
  titleKey: string;
  descriptionKey: string;
}

interface Award {
  id: string;
  titleKey: string;
  organizationKey: string;
  descriptionKey: string;
  year: string;
}

@Component({
  selector: 'app-about',
  imports: [TranslatePipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly milestones: readonly Milestone[] = [
    { year: '2016', titleKey: 'milestone2018Title', descriptionKey: 'milestone2018Desc' },
    { year: '2019', titleKey: 'milestone2019Title', descriptionKey: 'milestone2019Desc' },
    { year: '2021', titleKey: 'milestone2021Title', descriptionKey: 'milestone2021Desc' },
    { year: '2023', titleKey: 'milestone2023Title', descriptionKey: 'milestone2023Desc' },
    { year: '2024', titleKey: 'milestone2024Title', descriptionKey: 'milestone2024Desc' },
    { year: '2025', titleKey: 'milestone2025Title', descriptionKey: 'milestone2025Desc' },
  ];

  protected readonly values: readonly Value[] = [
    { iconName: 'heart',  titleKey: 'valueLoveTitle',        descriptionKey: 'valueLoveDesc' },
    { iconName: 'target', titleKey: 'valueExcellenceTitle',  descriptionKey: 'valueExcellenceDesc' },
    { iconName: 'trophy', titleKey: 'valueIntegrityTitle',   descriptionKey: 'valueIntegrityDesc' },
  ];

  protected readonly awards: readonly Award[] = [
    { id: 'a1', titleKey: 'award1Title', organizationKey: 'award1Org', descriptionKey: 'award1Desc', year: '2025' },
    { id: 'a2', titleKey: 'award2Title', organizationKey: 'award2Org', descriptionKey: 'award2Desc', year: '2024' },
    { id: 'a3', titleKey: 'award3Title', organizationKey: 'award3Org', descriptionKey: 'award3Desc', year: '2024' },
    { id: 'a4', titleKey: 'award4Title', organizationKey: 'award4Org', descriptionKey: 'award4Desc', year: '2023' },
  ];
}
