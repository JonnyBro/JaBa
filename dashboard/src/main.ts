import "@fontsource-variable/inter";
import "vue-sonner/style.css";
import "./assets/css/index.css";

import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./i18n";
import { queryClient } from "./plugins/query";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(VueQueryPlugin, { queryClient, enableDevtoolsV6Plugin: true });
app.use(router);

app.mount("#app");
