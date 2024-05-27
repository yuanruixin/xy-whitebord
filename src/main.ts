import { createApp } from "vue";
import "./style/index.css";

import "virtual:svg-icons-register";
import App from "./App.vue";
import pinia from "@/store";

const app = createApp(App).use(pinia);

app.mount("#app");
