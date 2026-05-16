# i18n Implementation Checklist

## ✅ What's Already Implemented

### Core Infrastructure
- [x] **I18n Service** (`src/app/services/i18n.service.ts`)
  - Manages language state with signals
  - Stores translations for English and Ukrainian
  - Handles language persistence to localStorage
  - Detects browser language on first load
  
- [x] **Translate Pipe** (`src/app/pipes/translate.pipe.ts`)
  - Use with `{{ 'key' | translate }}` in templates
  - Automatically updates when language changes

- [x] **Language Switcher Component** (`src/app/components/language-switcher/language-switcher.component.ts`)
  - EN/UK buttons in header
  - Saves selection to localStorage

- [x] **Updated Services**
  - `ParentsService`: Added `getLocalizedName()` and `mapWithLocalizedNames()`
  - `KittensService`: Added `getLocalizedName()` and `mapWithLocalizedNames()`
  - Both automatically select correct language name

### App Setup
- [x] Updated `app.ts` to import new components
- [x] Updated `app.html` with:
  - Language switcher component
  - Translated navigation labels

## 📝 What You Need to Do

### 1. Update Component Templates (HTML Files)

Use the translate pipe for all user-facing text:

**Example: parents.component.html**
```html
<!-- Before -->
<h1>Наши родители</h1>
<p>Фильтр по полу:</p>

<!-- After -->
<h1>{{ 'parentsTitle' | translate }}</h1>
<p>{{ 'sex' | translate }}:</p>
```

### 2. Update Component TypeScript Files

Replace hardcoded Russian strings with i18n service calls. Example updates:

**parents.component.ts**
```typescript
// Add imports
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

// Add i18n to component
protected readonly i18n = inject(I18nService);

// Add TranslatePipe to imports
imports: [RouterLink, TranslatePipe, CommonModule]

// Make options reactive to language
protected readonly sexOptions = computed<SexOption[]>(() => [
  { value: 'all', label: this.i18n.t('all') },
  { value: 'female', label: this.i18n.t('female') },
  { value: 'male', label: this.i18n.t('male') },
]);

// Update error handling
catchError(() =>
  of<LoadState>({
    parents: [],
    error: this.i18n.t('error'),
    loaded: true,
  }),
),
```

See example implementations:
- `src/app/pages/parents/parents.component.example.ts`
- `src/app/pages/kittens/kittens.component.example.ts`

### 3. Add Missing Translations

The i18n service needs more translations. Add them to `src/app/services/i18n.service.ts`:

```typescript
// English translations to add:
all: 'All',
// ... add any other missing labels

// Ukrainian translations to add:
all: 'Усі',
// ... add any other missing labels
```

### 4. Update Home Page Component

Update `src/app/pages/home/home.component.ts` and `.html`:
- Use `{{ 'homeTitle' | translate }}`
- Use `{{ 'homeDescription' | translate }}`

### 5. Update Families Page Component

Update `src/app/pages/families/families.component.ts` and `.html`:
- Use `{{ 'familiesTitle' | translate }}`
- Use `{{ 'familiesDescription' | translate }}`

### 6. Update Kitten Component (Detail Page)

If there's a kitten detail component:
- Use `KittensService.getLocalizedName()` for kitten name
- Translate status labels
- Translate all labels and messages

### 7. Update Parent Component (Detail Page)

If there's a parent detail component:
- Use `ParentsService.getLocalizedName()` for parent name
- Translate all labels and messages

## 🔄 Language Switching Flow

1. User clicks EN or UK button in header
2. Language switcher emits `i18n.setLanguage(lang)`
3. Signal updates
4. All pipes automatically re-evaluate
5. Computed signals with `i18n.t()` recalculate
6. Components with OnPush detection get marked for check
7. Templates update automatically

## 📚 File Locations Reference

- **i18n Service**: `src/app/services/i18n.service.ts`
- **Translate Pipe**: `src/app/pipes/translate.pipe.ts`
- **Language Switcher**: `src/app/components/language-switcher/language-switcher.component.ts`
- **Parent Service**: `src/app/pages/parents/parents.service.ts`
- **Kittens Service**: `src/app/pages/kittens/kittens.service.ts`
- **App Root**: `src/app/app.ts`, `src/app/app.html`

## 🎯 Testing Checklist

After implementing:
- [ ] Click language switcher to switch between EN/UK
- [ ] Verify all labels change
- [ ] Refresh page and verify language is remembered
- [ ] Check that kittens/parents names display correctly for current language
- [ ] Verify error messages translate
- [ ] Check mobile responsiveness of language switcher

## ✨ Optional Enhancements

1. **Add more translations** for additional UI text
2. **Create a translation management UI** to add/edit translations
3. **Support more languages** by adding to `Language` type and translations
4. **Add language detection for different regions** (e.g., en-US, en-GB)

## 🔗 Documentation Files

- [I18N_GUIDE.md](I18N_GUIDE.md) - Detailed usage guide
- [parents.component.example.ts](src/app/pages/parents/parents.component.example.ts) - Example component update
- [kittens.component.example.ts](src/app/pages/kittens/kittens.component.example.ts) - Example component update
