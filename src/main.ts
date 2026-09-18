import { createApp } from "vue";
import "./style/index.css";

import "virtual:svg-icons-register";
import App from "./App.vue";

const app = createApp(App);

app.mount("#app");
