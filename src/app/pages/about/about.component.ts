import { NgOptimizedImage } from '@angular/common';
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

/** A promise the cattery makes about every kitten that moves to a new home. */
interface ReadinessItem {
  id: string;
  iconName: 'paw' | 'shield' | 'document' | 'home';
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-about',
  imports: [TranslatePipe, NgOptimizedImage],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly milestones: readonly Milestone[] = [
    { year: '2010', titleKey: 'milestone2010Title', descriptionKey: 'milestone2010Desc' },
    { year: '2013', titleKey: 'milestone2013Title', descriptionKey: 'milestone2013Desc' },
    { year: '2015', titleKey: 'milestone2015Title', descriptionKey: 'milestone2015Desc' },
    { year: '2016', titleKey: 'milestone2016Title', descriptionKey: 'milestone2016Desc' },
    { year: '2019', titleKey: 'milestone2019Title', descriptionKey: 'milestone2019Desc' },
    { year: '2021', titleKey: 'milestone2021Title', descriptionKey: 'milestone2021Desc' },
  ];

  protected readonly values: readonly Value[] = [
    { iconName: 'heart',  titleKey: 'valueLoveTitle',        descriptionKey: 'valueLoveDesc' },
    { iconName: 'target', titleKey: 'valueExcellenceTitle',  descriptionKey: 'valueExcellenceDesc' },
    { iconName: 'trophy', titleKey: 'valueIntegrityTitle',   descriptionKey: 'valueIntegrityDesc' },
  ];

  protected readonly readiness: readonly ReadinessItem[] = [
    { id: 'r1', iconName: 'paw',      titleKey: 'readiness1Title', descriptionKey: 'readiness1Desc' },
    { id: 'r2', iconName: 'shield',   titleKey: 'readiness2Title', descriptionKey: 'readiness2Desc' },
    { id: 'r3', iconName: 'document', titleKey: 'readiness3Title', descriptionKey: 'readiness3Desc' },
    { id: 'r4', iconName: 'home',     titleKey: 'readiness4Title', descriptionKey: 'readiness4Desc' },
  ];
}
