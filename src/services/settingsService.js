export function saveSettings(key, value) {
  try {
    localStorage.setItem('clinergy_' + key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving settings to localStorage", error);
  }
}

export function getSettings(key, defaultValue) {
  try {
    const item = localStorage.getItem('clinergy_' + key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading settings from localStorage", error);
    return defaultValue;
  }
}
