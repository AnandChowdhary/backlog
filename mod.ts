import { join } from "https://deno.land/std@0.51.0/path/mod.ts";
import { timeAgo } from "https://deno.land/x/time_ago/mod.ts";
import {
  readFileStr,
  writeFileStr,
  writeJson,
} from "https://deno.land/std@0.51.0/fs/mod.ts";

const GH_PAT = Deno.env.get("GH_PAT");

const updateBacklog = async () => {
  if (!GH_PAT) throw new Error("GitHub Personal Access Token not found");

  // Fetch all notifications
  const notifications: {
    id: string;
    url: string;
    subscription_url: string;
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

  // Edit file structure
  const data = notifications
    .filter((i) => !i.repository.private)
    .filter((i) => new Date().getTime() - new Date(i.updated_at).getTime() > 172800000)
    .map((i) => {
      const repo = { ...i.repository };
      delete i.repository;
      delete i.id;
      delete i.unread;
      delete i.reason;
      delete i.last_read_at;
      delete i.url;
      delete i.subscription_url;
      i.subject.url = i.subject.url.replace(
        "https://api.github.com/repos/",
        "https://github.com/"
      );
      i.subject.latest_comment_url = i.subject.latest_comment_url.replace(
        "https://api.github.com/repos/",
        "https://github.com/"
      );
      return {
        ...i,
        repository: repo.full_name,
        description: repo.description,
      };
    });

  // Write JSON file
  await writeJson(join(".", "data.json"), data, { spaces: 2 });

  // Write README.md
  const readmeText = await readFileStr(join(".", "template.md"));
  await writeFileStr(
    join(".", "README.md"),
    readmeText.replace(
      "<!--list-->",
      data
        .map(
          (i) =>
            `- **[${i.subject.title}](${i.subject.url})**  \n[${
              i.repository
            }](https://github.com/${i.repository}) · ${
              i.description
            }  \nLast updated ${timeAgo(new Date(i.updated_at))}  \n`
        )
        .join("\n")
    )
  );
};

updateBacklog();
