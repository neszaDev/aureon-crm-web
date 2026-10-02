import { installTranslationResilience } from 'translation-resilience';

// Install the DOM shim before React renders because browser translators replace React-owned
// text nodes, which can cause crashes and frozen updates.
installTranslationResilience();
