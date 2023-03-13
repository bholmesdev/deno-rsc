import { Suspense } from "react";
import { LikeButton } from "../LikeButton.tsx";

export default async function Index() {
  return (
    <>
      <p>Hello world?</p>{" "}
      <Suspense fallback={"Loading..."}>
        <SubComp />
      </Suspense>
    </>
  );
}

async function SubComp() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <LikeButton />;
}
