# i18n Implementation Guide

This document explains how to use the i18n (internationalization) system in this Angular application.

## Overview

The application supports two languages:
- **English** (`en`)
- **Ukrainian** (`uk`)

Users can switch languages using the language switcher in the header. The selected language is saved to localStorage.

## Using the I18n Service

### 1. Inject the I18nService

```typescript
import { I18nService } from '@app/services/i18n.service';

@Component({...})
export class MyComponent {
  private readonly i18n = inject(I18nService);
}
```

### 2. Get Current Language

```typescript
const currentLang = this.i18n.getLanguage(); // Returns 'en' or 'uk'
```

### 3. Translate Text in TypeScript

```typescript
const message = this.i18n.t('mykey'); // or this.i18n.translate('mykey')
```

### 4. Use TranslatePipe in Templates

```html
<h1>{{ 'homeTitle' | translate }}</h1>
<p>{{ 'homeDescription' | translate }}</p>
```

## Working with Data (Kittens and Parents)

### Getting Localized Names

The services now have helper methods to get localized names based on the current language:

```typescript
// In parents.component.ts
private readonly parentsService = inject(ParentsService);
private readonly i18n = inject(I18nService);

private loadState = toSignal(
  this.parentsService.getParents().pipe(
    map((parents) => ({
      parents: this.parentsService.mapWithLocalizedNames(parents),
      error: '',
      loaded: true,
    })),
    catchError(() => of<LoadState>({
      parents: [],
      error: this.i18n.t('error'),
      loaded: true,
    })),
  ),
  { initialValue: { parents: [], error: '', loaded: false } }
);
```

### Example: Update Parents Component

**Before:**
```typescript
const sexOptions: SexOption[] = [
  { value: 'all', label: 'Все' },
  { value: 'female', label: 'Кошки' },
  { value: 'male', label: 'Коты' },
];

formatSex(sex: ParentListItem['sex']): string {
  if (sex === 'female') return 'Кошка';
  if (sex === 'male') return 'Кот';
  return 'Не указан';
}
```

**After:**
```typescript
private readonly i18n = inject(I18nService);

protected readonly sexOptions = computed(() => [
  { value: 'all', label: this.i18n.t('all') },
  { value: 'female', label: this.i18n.t('female') },
  { value: 'male', label: this.i18n.t('male') },
]);

formatSex(sex: ParentListItem['sex']): string {
  if (sex === 'female') return this.i18n.t('female');
  if (sex === 'male') return this.i18n.t('male');
  return this.i18n.t('noData');
}
```

## Adding New Translations

All translations are in [src/app/services/i18n.service.ts](src/app/services/i18n.service.ts).

### To add a new translation:

1. Add the key to both English and Ukrainian objects:

```typescript
// In i18n.service.ts, inside initializeTranslations()
this.translations.set('en', {
  // ... existing translations
  myNewKey: 'English text',
});

this.translations.set('uk', {
  // ... existing translations
  myNewKey: 'Український текст',
});
```

2. Use it in templates:
```html
{{ 'myNewKey' | translate }}
```

Or in TypeScript:
```typescript
const text = this.i18n.t('myNewKey');
```

## Handling Language Changes

The language signal is reactive. When language changes:
- The pipe automatically updates templates
- Any computed signals that depend on language will recalculate
- Components using OnPush change detection will be marked for check

For components that need to react to language changes:

```typescript
protected sexOptions = computed(() => [
  { value: 'all', label: this.i18n.t('all') },
  // The array will be recreated when language changes
]);
```

## Best Practices

1. **Always use translation keys for user-facing text**
   - ✅ Do: `{{ 'home' | translate }}`
   - ❌ Don't: `{{ 'Home' }}`

2. **Use computed() for options that depend on language**
   - ✅ Do: `sexOptions = computed(() => [...])`
   - ❌ Don't: `sexOptions = [{label: 'Все'}]`

3. **Keep translations organized by feature**
   - Group related translations together in comments

4. **For data from API, use service helper methods**
   - ✅ Do: `parentsService.getLocalizedName(parent)`
   - ❌ Don't: `parent.nameEn`

5. **Always import the TranslatePipe in components that use it**
   - Add `TranslatePipe` to component imports

## Language Persistence

The selected language is automatically saved to localStorage:
- Key: `language`
- Value: `en` or `uk`

When the app loads, it tries to:
1. Load from localStorage
2. If not found, detect from browser language
3. Default to English if detection fails
