import { createApp } from "vue";
import "./style/index.css";

import "virtual:svg-icons-register";
import App from "./App.vue";
import pinia from "@/store";
import directive from "@/directive";


const app = createApp(App).use(pinia).use(directive);

app.mount("#app");
