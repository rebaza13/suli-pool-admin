import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/HeroPage.vue') },
      { path: 'about', component: () => import('pages/AboutSectionPage.vue') },
      { path: 'features', component: () => import('pages/DashboardPage.vue') },
      { path: 'projects', component: () => import('pages/ProjectsPage.vue') },
      { path: 'locations', component: () => import('pages/LocationsPage.vue') },
      { path: 'installation', component: () => import('pages/InstallationPage.vue') },
      { path: 'timeline', component: () => import('pages/TimelinePage.vue') },
      { path: 'why-we-different', component: () => import('pages/WhyWeDifferentPage.vue') },
      { path: 'company-statistics', component: () => import('pages/CompanyStatisticsPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
