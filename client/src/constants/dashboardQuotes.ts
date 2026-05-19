export interface DashboardQuote {
  id: string;
  text: string;
  author: string;
}

export const dashboardQuotes: DashboardQuote[] = [
  {
    id: 'lao-tzu-nature',
    text: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
  },
  {
    id: 'rumi-quiet',
    text: 'The quieter you become, the more you are able to hear.',
    author: 'Rumi',
  },
  {
    id: 'thich-nhat-hanh-present',
    text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.',
    author: 'Thich Nhat Hanh',
  },
  {
    id: 'marcus-aurelius-mind',
    text: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    id: 'pema-chodron-space',
    text: 'You are the sky. Everything else is just the weather.',
    author: 'Pema Chodron',
  },
];
