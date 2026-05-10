import { NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KittensService, type KittenApiItem } from './kittens.service';
import { finalize } from 'rxjs';

type KittenStatus = 'available' | 'reserved' | 'offline';

interface KittenListItem {
  id: string;
  name: string;
  breed: string;
  age: string;
  color: string;
  status: KittenStatus;
  priceLabel: string;
  image: string;
  tags: string[];
}

interface StatusOption {
  value: KittenStatus | 'all';
  label: string;
}

@Component({
  selector: 'app-kittens',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './kittens.component.html',
  styleUrl: './kittens.component.scss',
})
export class KittensComponent implements OnInit {
  private readonly kittensService = inject(KittensService);

  protected kittens: KittenListItem[] = [];
  protected isLoading = true;
  protected loadError = '';

  protected readonly statusOptions: StatusOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'available', label: 'Свободен' },
    { value: 'reserved', label: 'Резерв' },
    { value: 'offline', label: 'Неактивен' },
  ];

  protected activeStatus: KittenStatus | 'all' = 'all';

  ngOnInit(): void {
    this.kittensService
      .getKittens()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (kittens) => {
          this.kittens = kittens.map((kitten) => this.mapKittenToListItem(kitten));
        },
        error: () => {
          this.loadError = 'Не удалось загрузить котят. Попробуйте обновить страницу чуть позже.';
        },
      });
  }

  protected get filteredKittens(): KittenListItem[] {
    if (this.activeStatus === 'all') {
      return this.kittens;
    }
    return this.kittens.filter((kitten) => kitten.status === this.activeStatus);
  }

  protected setStatus(status: KittenStatus | 'all'): void {
    this.activeStatus = status;
  }

  protected getStatusLabel(status: KittenStatus): string {
    if (status === 'available') {
      return 'Свободен';
    }
    if (status === 'reserved') {
      return 'Резерв';
    }
    return 'Неактивен';
  }

  private mapKittenToListItem(kitten: KittenApiItem): KittenListItem {
    const fallbackImage =
      'https://images.unsplash.com/photo-1518288774672-b94e808873ff?auto=format&fit=crop&w=1200&q=80';

    return {
      id: kitten._id,
      name: kitten.nameUa || kitten.nameEn || 'Без имени',
      breed: kitten.breed || 'Порода не указана',
      age: this.formatBirthDay(kitten.birthDay),
      color: kitten.color || 'Цвет не указан',
      status: this.mapStatus(kitten.status),
      priceLabel: this.formatPrice(kitten),
      image:
        kitten.images?.find((image) => image.isMain === true)?.full ||
        kitten.images?.[0]?.full ||
        fallbackImage,
      tags: [this.formatSex(kitten.sex)],
    };
  }

  private mapStatus(status?: string): KittenStatus {
    if (status === 'reserved') {
      return 'reserved';
    }
    if (status === 'offline' || status === 'sold') {
      return 'offline';
    }
    return 'available';
  }

  private formatBirthDay(birthDay?: string): string {
    if (!birthDay) {
      return 'Возраст не указан';
    }
    const date = new Date(birthDay);
    if (Number.isNaN(date.getTime())) {
      return 'Возраст не указан';
    }
    return date.toLocaleDateString('uk-UA');
  }

  private formatPrice(kitten: KittenApiItem): string {
    const pet = kitten.price?.pet;
    const breeding = kitten.price?.breeding;

    if (pet || breeding) {
      const parts: string[] = [];
      if (pet) {
        parts.push(`pet: ${pet}`);
      }
      if (breeding) {
        parts.push(`breeding: ${breeding}`);
      }
      return parts.join(' | ');
    }
    return 'Цена по запросу';
  }

  private formatSex(sex?: string): string {
    if (sex === 'female') {
      return 'Девочка';
    }
    if (sex === 'male') {
      return 'Мальчик';
    }
    return 'Пол не указан';
  }
}
