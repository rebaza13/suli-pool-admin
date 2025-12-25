import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/auth-store';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation guards
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    // Initialize auth if not already done
    if (authStore.loading) {
      await authStore.init();
    }

    const isLoginPage = to.path === '/login';
    const isAuthenticated = authStore.isAuthenticated;

    if (isLoginPage && isAuthenticated) {
      // If logged in and trying to access login page, redirect to home
      next('/');
    } else if (!isLoginPage && !isAuthenticated) {
      // If not logged in and trying to access protected route, redirect to login
      next('/login');
    } else {
      // Allow navigation
      next();
    }
  });

  return Router;
});
