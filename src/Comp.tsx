import React from "react";

export async function Comp() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return (
    <>
      <p>Hello world?</p> <SubComp />
    </>
  );
}

async function SubComp() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <p>SubComp</p>;
}
