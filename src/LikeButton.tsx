"use client";
import { useState } from "react";

export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "Unlike" : "Like"}
    </button>
  );
}

// TODO: generate this metadata?
LikeButton.$$typeof = Symbol.for("react.client.reference");
LikeButton.filepath = import.meta.url;
