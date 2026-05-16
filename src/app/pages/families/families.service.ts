import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface FamilyBreed {
  id: string;
  name: string;
  description: string;
  image: string;
  characteristics: {
    temperament: string;
    size: string;
    energyLevel: string;
    maintenanceLevel: string;
  };
}

export interface FamilyInfo {
  id: string;
  breed: string;
  momId: string;
  dadId: string;
  kittensCount: number;
  description: string;
  established: string;
  achievements: string[];
  image: string;
}

export interface BreedsResponse {
  data: FamilyBreed[];
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class FamiliesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  // Mock breeds data - в реальности будет с API
  private mockBreeds: FamilyBreed[] = [
    {
      id: '1',
      name: 'British Shorthair',
      description: 'Компактная кошка с мягким характером',
      image: 'https://images.unsplash.com/photo-1574158622147-08a9b37261a7?auto=format&fit=crop&w=500&q=80',
      characteristics: {
        temperament: 'Спокойный, независимый',
        size: 'Средний (4-8 кг)',
        energyLevel: 'Средний',
        maintenanceLevel: 'Низкий',
      },
    },
    {
      id: '2',
      name: 'Scottish Fold',
      description: 'Уникальные складчатые ушки и круглое лицо',
      image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=500&q=80',
      characteristics: {
        temperament: 'Дружелюбный, игривый',
        size: 'Средний (2.5-4 кг)',
        energyLevel: 'Высокий',
        maintenanceLevel: 'Средний',
      },
    },
    {
      id: '3',
      name: 'Maine Coon',
      description: 'Величественные кошки с длинной шерстью',
      image: 'https://images.unsplash.com/photo-1518640467-a28a42c84fb1?auto=format&fit=crop&w=500&q=80',
      characteristics: {
        temperament: 'Общительный, умный',
        size: 'Крупный (5-11 кг)',
        energyLevel: 'Средний',
        maintenanceLevel: 'Высокий',
      },
    },
  ];

  getBreeds(): Observable<FamilyBreed[]> {
    // Можно заменить на this.http.get если будет API
    return new Observable((observer) => {
      observer.next(this.mockBreeds);
      observer.complete();
    });
  }

  getBreedById(id: string): Observable<FamilyBreed | undefined> {
    return new Observable((observer) => {
      observer.next(this.mockBreeds.find((b) => b.id === id));
      observer.complete();
    });
  }
}
