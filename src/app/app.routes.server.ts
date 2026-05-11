import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. Динамические страницы каталога (всегда актуальные данные с Railway)
  {
    path: 'kittens',
    renderMode: RenderMode.Server,
  },
  {
    path: 'parents',
    renderMode: RenderMode.Server,
  },
  {
    path: 'families',
    renderMode: RenderMode.Server,
  },

  // 2. Детальные страницы (нужен ServerMode, чтобы не настраивать список ID вручную)
  {
    path: 'kittens/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'parents/:id',
    renderMode: RenderMode.Server,
  },

  // 3. Статичные страницы (собираются один раз при билде для максимальной скорости)
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
