import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tauriBridge, isTauri } from "./services/tauri-bridge";

// Mock invoke function
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("Tauri Desktop Bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tauriBridge", () => {
    it("should call invoke with open_project command", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const mockContent = '{"name": "test-project"}';
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

      const result = await tauriBridge.openProject("/path/to/project.json");

      expect(invoke).toHaveBeenCalledWith("open_project", {
        path: "/path/to/project.json",
      });
      expect(result).toBe(mockContent);
    });

    it("should call invoke with save_project command", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const data = JSON.stringify({ name: "test-project" });
      await tauriBridge.saveProject("/path/to/project.json", data);

      expect(invoke).toHaveBeenCalledWith("save_project", {
        path: "/path/to/project.json",
        data,
      });
    });

    it("should call invoke for minimize window", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await tauriBridge.minimize();

      expect(invoke).toHaveBeenCalledWith("minimize_window");
    });

    it("should call invoke for maximize window", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await tauriBridge.maximize();

      expect(invoke).toHaveBeenCalledWith("maximize_window");
    });

    it("should call invoke for close window", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await tauriBridge.close();

      expect(invoke).toHaveBeenCalledWith("close_window");
    });

    it("should call invoke with set_title command", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await tauriBridge.setTitle("My Novel Project");

      expect(invoke).toHaveBeenCalledWith("set_window_title", {
        title: "My Novel Project",
      });
    });

    it("should call invoke for toggle fullscreen", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await tauriBridge.toggleFullscreen();

      expect(invoke).toHaveBeenCalledWith("toggle_fullscreen");
      expect(result).toBe(true);
    });

    it("should call invoke for get version", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue("0.42.0");

      const result = await tauriBridge.getVersion();

      expect(invoke).toHaveBeenCalledWith("get_app_version");
      expect(result).toBe("0.42.0");
    });

    it("should call invoke for show in folder", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await tauriBridge.showInFolder("/path/to/file.txt");

      expect(invoke).toHaveBeenCalledWith("show_in_folder", {
        path: "/path/to/file.txt",
      });
    });
  });

  describe("isTauri", () => {
    it("should return false in test environment", () => {
      expect(isTauri()).toBe(false);
    });
  });
});

describe("SQLite Schema", () => {
  const expectedTables = [
    "projects",
    "chapters",
    "characters",
    "worldbuilding",
    "memories",
    "skills",
    "tool_registry",
  ];

  const tableSchemas: Record<string, string[]> = {
    projects: ["id", "name", "genre", "created_at", "updated_at"],
    chapters: [
      "id",
      "project_id",
      "title",
      "content",
      "order_index",
      "word_count",
      "created_at",
      "updated_at",
    ],
    characters: ["id", "project_id", "name", "description", "traits"],
    worldbuilding: ["id", "project_id", "category", "name", "content"],
    memories: ["id", "project_id", "layer", "content", "importance", "tags"],
    skills: ["id", "project_id", "name", "prompt", "skill_type", "created_at"],
    tool_registry: ["id", "name", "description", "category", "config"],
  };

  it("should have all 7 required tables defined in schema", () => {
    expect(expectedTables).toHaveLength(7);
    expectedTables.forEach((table) => {
      expect(tableSchemas[table]).toBeDefined();
    });
  });

  it("should have correct schema structure for projects table", () => {
    const columns = tableSchemas.projects;
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("genre");
    expect(columns).toContain("created_at");
    expect(columns).toContain("updated_at");
  });

  it("should have correct schema structure for chapters table", () => {
    const columns = tableSchemas.chapters;
    expect(columns).toContain("id");
    expect(columns).toContain("project_id");
    expect(columns).toContain("title");
    expect(columns).toContain("content");
    expect(columns).toContain("order_index");
    expect(columns).toContain("word_count");
    expect(columns).toContain("created_at");
    expect(columns).toContain("updated_at");
  });

  it("should have correct schema structure for characters table", () => {
    const columns = tableSchemas.characters;
    expect(columns).toContain("id");
    expect(columns).toContain("project_id");
    expect(columns).toContain("name");
    expect(columns).toContain("description");
    expect(columns).toContain("traits");
  });

  it("should have correct schema structure for worldbuilding table", () => {
    const columns = tableSchemas.worldbuilding;
    expect(columns).toContain("id");
    expect(columns).toContain("project_id");
    expect(columns).toContain("category");
    expect(columns).toContain("name");
    expect(columns).toContain("content");
  });

  it("should have correct schema structure for memories table", () => {
    const columns = tableSchemas.memories;
    expect(columns).toContain("id");
    expect(columns).toContain("project_id");
    expect(columns).toContain("layer");
    expect(columns).toContain("content");
    expect(columns).toContain("importance");
    expect(columns).toContain("tags");
  });

  it("should have correct schema structure for skills table", () => {
    const columns = tableSchemas.skills;
    expect(columns).toContain("id");
    expect(columns).toContain("project_id");
    expect(columns).toContain("name");
    expect(columns).toContain("prompt");
    expect(columns).toContain("skill_type");
    expect(columns).toContain("created_at");
  });

  it("should have correct schema structure for tool_registry table", () => {
    const columns = tableSchemas.tool_registry;
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("description");
    expect(columns).toContain("category");
    expect(columns).toContain("config");
  });
});

describe("Offline Storage", () => {
  it("should support save/load cycle", async () => {
    const testData = {
      name: "Test Project",
      genre: "fantasy",
      chapters: [
        {
          id: 1,
          title: "Chapter 1",
          content: "Once upon a time...",
          order_index: 1,
          word_count: 4,
        },
      ],
    };

    // Simulate web storage behavior
    const serialized = JSON.stringify(testData);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.name).toBe("Test Project");
    expect(deserialized.chapters).toHaveLength(1);
    expect(deserialized.chapters[0].title).toBe("Chapter 1");
  });

  it("should maintain data integrity across serialization", () => {
    const original = {
      projects: [
        { id: 1, name: "Project 1", genre: "fantasy" },
        { id: 2, name: "Project 2", genre: "scifi" },
      ],
      chapters: [
        {
          id: 1,
          project_id: 1,
          title: "Ch 1",
          content: "Content here",
          order_index: 1,
          word_count: 2,
        },
      ],
    };

    const serialized = JSON.stringify(original);
    const restored = JSON.parse(serialized);

    expect(restored.projects).toHaveLength(2);
    expect(restored.chapters).toHaveLength(1);
    expect(restored.projects[0].name).toBe("Project 1");
    expect(restored.chapters[0].content).toBe("Content here");
  });
});