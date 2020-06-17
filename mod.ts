import { join } from "https://deno.land/std/path/mod.ts";
import { writeJson } from "https://deno.land/std/fs/mod.ts";

const GH_PAT = Deno.env.get("GH_PAT");

const updateBacklog = async () => {
  if (!GH_PAT) throw new Error("GitHub Personal Access Token not found");

  // Fetch all notifications
  const notifications: {
    id: string;
    repository: {
      id: number;
      full_name: string;
      private: boolean;
      description: string;
      html_url: string;
    };
    subject: {
      title: string;
      url: string;
      latest_comment_url: string;
      type: "Issue";
    };
    reason: "subscribed";
    unread: boolean;
    updated_at: string;
    last_read_at: string;
  }[] = await (
    await fetch("https://api.github.com/notifications", {
      headers: {
        Authorization: `Bearer ${GH_PAT}`,
      },
    })
  ).json();
  await writeJson(join(".", "data.json"), notifications, { spaces: 2 });
};

updateBacklog();
