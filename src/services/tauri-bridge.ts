import { invoke } from "@tauri-apps/api/core";

/**
 * Tauri Bridge - TypeScript interface to Rust backend commands
 */
export const tauriBridge = {
  /**
   * Open a project file from the local filesystem
   */
  openProject: (path: string): Promise<string> => invoke("open_project", { path }),

  /**
   * Save project data to a local file
   */
  saveProject: (path: string, data: string): Promise<void> =>
    invoke("save_project", { path, data }),

  /**
   * Minimize the main window
   */
  minimize: (): Promise<void> => invoke("minimize_window"),

  /**
   * Maximize or restore the main window
   */
  maximize: (): Promise<void> => invoke("maximize_window"),

  /**
   * Close the main window
   */
  close: (): Promise<void> => invoke("close_window"),

  /**
   * Set the window title
   */
  setTitle: (title: string): Promise<void> => invoke("set_window_title", { title }),

  /**
   * Toggle fullscreen mode
   * @returns true if entering fullscreen, false if exiting
   */
  toggleFullscreen: (): Promise<boolean> => invoke("toggle_fullscreen"),

  /**
   * Get the application version
   */
  getVersion: (): Promise<string> => invoke("get_app_version"),

  /**
   * Show a file in the system file explorer
   */
  showInFolder: (path: string): Promise<void> => invoke("show_in_folder", { path }),
};

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export default tauriBridge;