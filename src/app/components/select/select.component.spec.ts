import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent, type SelectOption } from './select.component';

describe('SelectComponent', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let host: HTMLElement;
  let chosen: string[];

  const options: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'blue', label: 'Blue' },
    { value: 'cream', label: 'Cream' },
  ];

  function trigger(): HTMLButtonElement {
    const button = host.querySelector<HTMLButtonElement>('.app-select__trigger');
    if (!button) {
      throw new Error('no trigger');
    }
    return button;
  }

  function optionButtons(): HTMLButtonElement[] {
    return [...host.querySelectorAll<HTMLButtonElement>('.app-select__option')];
  }

  /** A key pressed on the trigger, as the browser delivers it: it bubbles. */
  async function press(key: string, shiftKey = false): Promise<void> {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
    await fixture.whenStable();
  }

  function highlighted(): string | null {
    const focused = host.querySelector('.app-select__option--focused .app-select__option-label');
    return focused?.textContent?.trim() ?? null;
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'all');
    fixture.componentRef.setInput('ariaLabel', 'Filter by colour');

    chosen = [];
    fixture.componentInstance.valueChange.subscribe((value) => chosen.push(value));

    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('opens on ArrowDown and highlights the current value', async () => {
    await press('ArrowDown');

    expect(optionButtons()).toHaveLength(3);
    expect(highlighted()).toBe('All');
  });

  it('advances the highlight by exactly one option per ArrowDown', async () => {
    await press('ArrowDown');
    await press('ArrowDown');

    expect(highlighted()).toBe('Blue');
  });

  it('picks the highlighted option on Enter, not the one after it', async () => {
    await press('ArrowDown');
    await press('ArrowDown');
    expect(highlighted()).toBe('Blue');

    await press('Enter');

    expect(chosen).toEqual(['blue']);
    expect(optionButtons()).toHaveLength(0);
  });

  it('wraps the highlight around both ends', async () => {
    await press('ArrowDown');
    await press('ArrowUp');
    expect(highlighted()).toBe('Cream');

    await press('ArrowDown');
    expect(highlighted()).toBe('All');
  });

  it('jumps to the first and last option with Home and End', async () => {
    await press('ArrowDown');

    await press('End');
    expect(highlighted()).toBe('Cream');

    await press('Home');
    expect(highlighted()).toBe('All');
  });

  it('points the trigger at the highlighted option for a screen reader', async () => {
    expect(trigger().getAttribute('role')).toBe('combobox');
    expect(trigger().getAttribute('aria-activedescendant')).toBeNull();

    await press('ArrowDown');
    await press('ArrowDown');

    const active = trigger().getAttribute('aria-activedescendant');
    expect(active).toBe(optionButtons()[1].id);
    expect(trigger().getAttribute('aria-controls')).toBe(
      host.querySelector('.app-select__panel')?.id,
    );
  });

  it('closes on Escape without choosing anything', async () => {
    await press('ArrowDown');
    await press('Escape');

    expect(optionButtons()).toHaveLength(0);
    expect(chosen).toEqual([]);
  });

  it('closes when Tab leaves the control', async () => {
    await press('ArrowDown');
    await press('Tab');

    expect(optionButtons()).toHaveLength(0);
    expect(chosen).toEqual([]);
  });

  it('says nothing when the option already selected is chosen again', async () => {
    await press('ArrowDown');
    await press('Enter');

    expect(chosen).toEqual([]);
  });

  it('closes on a click outside itself', async () => {
    await press('ArrowDown');
    expect(optionButtons()).toHaveLength(3);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(optionButtons()).toHaveLength(0);
  });
});
