from __future__ import annotations

import re
import sys
from pathlib import Path

ALLOWED_TYPES = "feat|fix|refactor|perf|docs|style|test|chore|ci|build|revert"
HEADER = re.compile(rf"^({ALLOWED_TYPES})(\([a-z0-9._-]+\))?!?: .+")


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_commit_msg.py <commit-msg-file>", file=sys.stderr)
        return 2

    message_path = Path(sys.argv[1])
    first_line = first_non_comment_line(message_path)
    if first_line is None:
        print("commit message is empty", file=sys.stderr)
        return 1
    if HEADER.fullmatch(first_line):
        return 0

    print(
        "commit message must use Conventional Commit format, e.g. "
        "feat: add analyzer or fix(config): reject invalid input",
        file=sys.stderr,
    )
    return 1


def first_non_comment_line(path: Path) -> str | None:
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            return stripped
    return None


if __name__ == "__main__":
    raise SystemExit(main())
