# Before and After: Component Migration to i18n

This document shows real examples of how to migrate existing components to use the i18n system.

## Example 1: Parents Component (TypeScript)

### Before (Russian hardcoded)
```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { ParentsService, type ParentApiItem } from './parents.service';

interface SexOption {
  value: SexFilter;
  label: string;
}

export class ParentsComponent {
  private readonly parentsService = inject(ParentsService);

  protected readonly sexOptions: SexOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'female', label: 'Кошки' },
    { value: 'male', label: 'Коты' },
  ];

  private readonly loadState = toSignal(
    this.parentsService.getParents().pipe(
      map(parents => ({...})),
      catchError(() => of({
        parents: [],
        error: 'Не удалось загрузить список родителей. Попробуйте обновить страницу.',
        loaded: true,
      })),
    ),
  );

  protected formatSex(sex: ParentListItem['sex']): string {
    if (sex === 'female') return 'Кошка';
    if (sex === 'male') return 'Кот';
    return 'Не указан';
  }
}
```

### After (with i18n)
```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { ParentsService, type ParentApiItem } from './parents.service';
import { I18nService } from '../../services/i18n.service';  // ADD THIS
import { TranslatePipe } from '../../pipes/translate.pipe';   // ADD THIS
import { CommonModule } from '@angular/common';                // ADD THIS

interface SexOption {
  value: SexFilter;
  label: string;
}

@Component({
  selector: 'app-parents',
  imports: [RouterLink, TranslatePipe, CommonModule],  // ADD TranslatePipe, CommonModule
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentsComponent {
  private readonly parentsService = inject(ParentsService);
  protected readonly i18n = inject(I18nService);  // ADD THIS

  // CHANGE: Make sexOptions reactive to language
  protected readonly sexOptions = computed<SexOption[]>(() => [
    { value: 'all', label: this.i18n.t('all') },
    { value: 'female', label: this.i18n.t('female') },
    { value: 'male', label: this.i18n.t('male') },
  ]);

  private readonly loadState = toSignal(
    this.parentsService.getParents().pipe(
      map(parents => ({...})),
      catchError(() => of({
        parents: [],
        error: this.i18n.t('error'),  // CHANGE: Use translated error
        loaded: true,
      })),
    ),
  );

  protected formatSex(sex: ParentListItem['sex']): string {
    // CHANGE: Use i18n for all labels
    if (sex === 'female') return this.i18n.t('female');
    if (sex === 'male') return this.i18n.t('male');
    return this.i18n.t('noData');
  }
}
```

## Example 2: Parents Template (HTML)

### Before (Russian hardcoded)
```html
<section class="parents-page">
  <h1>Наши родители</h1>
  <p class="subtitle">Познакомьтесь с нашими красивыми родителями</p>

  <div class="filters">
    <label>Фильтр по полу:</label>
    <button 
      *ngFor="let option of sexOptions"
      [class.active]="activeSex() === option.value"
      (click)="setSex(option.value)"
    >
      {{ option.label }}
    </button>
  </div>

  <div *ngIf="isLoading()" class="loading">
    Загрузка...
  </div>

  <div *ngIf="loadError()" class="error">
    {{ loadError() }}
  </div>

  <div class="parents-grid">
    <a *ngFor="let parent of filteredParents()" [routerLink]="[parent.id]">
      <img [src]="parent.image" [alt]="parent.name" />
      <h3>{{ parent.name }}</h3>
      <p><strong>Порода:</strong> {{ parent.breed }}</p>
      <p><strong>Цвет:</strong> {{ parent.color }}</p>
      <p><strong>Пол:</strong> {{ formatSex(parent.sex) }}</p>
      <p *ngIf="parent.kittensCount > 0">
        <strong>Котят:</strong> {{ parent.kittensCount }}
      </p>
    </a>
  </div>
</section>
```

### After (with i18n)
```html
<section class="parents-page">
  <h1>{{ 'parentsTitle' | translate }}</h1>
  <p class="subtitle">{{ 'parentsDescription' | translate }}</p>

  <div class="filters">
    <label>{{ 'sex' | translate }}:</label>
    <button 
      *ngFor="let option of sexOptions()"
      [class.active]="activeSex() === option.value"
      (click)="setSex(option.value)"
    >
      {{ option.label }}
    </button>
  </div>

  <div *ngIf="isLoading()" class="loading">
    {{ 'loading' | translate }}
  </div>

  <div *ngIf="loadError()" class="error">
    {{ loadError() }}
  </div>

  <div class="parents-grid">
    <a *ngFor="let parent of filteredParents()" [routerLink]="[parent.id]">
      <img [src]="parent.image" [alt]="parent.name" />
      <h3>{{ parent.name }}</h3>
      <p><strong>{{ 'breed' | translate }}:</strong> {{ parent.breed }}</p>
      <p><strong>{{ 'color' | translate }}:</strong> {{ parent.color }}</p>
      <p><strong>{{ 'sex' | translate }}:</strong> {{ formatSex(parent.sex) }}</p>
      <p *ngIf="parent.kittensCount > 0">
        <strong>{{ 'kittens' | translate }}:</strong> {{ parent.kittensCount }}
      </p>
    </a>
  </div>
</section>
```

## Key Changes Summary

### TypeScript Changes
1. **Add imports:**
   ```typescript
   import { I18nService } from '../../services/i18n.service';
   import { TranslatePipe } from '../../pipes/translate.pipe';
   import { CommonModule } from '@angular/common';
   ```

2. **Add to component imports:**
   ```typescript
   imports: [RouterLink, TranslatePipe, CommonModule]
   ```

3. **Inject i18n service:**
   ```typescript
   protected readonly i18n = inject(I18nService);
   ```

4. **Make options reactive:**
   ```typescript
   protected readonly sexOptions = computed<SexOption[]>(() => [
     { value: 'all', label: this.i18n.t('all') },
     // ... more options
   ]);
   ```

5. **Use i18n in methods:**
   ```typescript
   protected formatSex(sex: 'male' | 'female'): string {
     if (sex === 'female') return this.i18n.t('female');
     if (sex === 'male') return this.i18n.t('male');
     return this.i18n.t('noData');
   }
   ```

### HTML Changes
1. **Replace hardcoded text with pipe:**
   ```html
   <!-- Before -->
   <h1>Наши родители</h1>
   
   <!-- After -->
   <h1>{{ 'parentsTitle' | translate }}</h1>
   ```

2. **Update computed signal calls:**
   ```html
   <!-- Before -->
   *ngFor="let option of sexOptions"
   
   <!-- After -->
   *ngFor="let option of sexOptions()"
   ```

3. **Keep labels dynamic from TypeScript:**
   ```html
   <!-- sexOptions array items have .label from i18n.t() -->
   {{ option.label }}
   ```

## Migration Steps

For each component:
1. ✅ Add i18n service import
2. ✅ Add TranslatePipe to component imports
3. ✅ Add CommonModule if using *ngIf, *ngFor
4. ✅ Inject I18nService with `inject()`
5. ✅ Make string arrays computed() if language-dependent
6. ✅ Replace hardcoded strings in methods with i18n.t()
7. ✅ Replace hardcoded text in templates with translate pipe
8. ✅ Test language switching

## Common Patterns

### Pattern 1: Translating Fixed Labels
```typescript
// TS
protected formatStatus(status: string): string {
  return this.i18n.t(`status_${status}`);
}

// HTML
<span>{{ formatStatus(item.status) }}</span>
```

### Pattern 2: Dynamic Options Arrays
```typescript
// TS
protected readonly filterOptions = computed(() => [
  { value: 'all', label: this.i18n.t('all') },
  { value: 'active', label: this.i18n.t('active') },
]);

// HTML
<button *ngFor="let opt of filterOptions()">
  {{ opt.label }}
</button>
```

### Pattern 3: Error Messages
```typescript
// TS
catchError(() => of({
  error: this.i18n.t('errorLoadingData'),
}))

// HTML
<p *ngIf="error()">{{ error() }}</p>
```

### Pattern 4: Conditional Text
```typescript
// TS
protected getText(count: number): string {
  if (count === 0) return this.i18n.t('noItems');
  if (count === 1) return this.i18n.t('oneItem');
  return this.i18n.t('multipleItems');
}

// HTML
<p>{{ getText(items().length) }}</p>
```
