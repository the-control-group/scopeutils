import test from "ava";
import {
  AnyMultiple,
  AnySingle,
  Pattern,
  getIntersection,
  isSuperset,
  compare
} from "./pattern";

test("isSuperset(a, b) - a ⊉ a.b", t => {
  t.is(isSuperset(["a"], ["a", "b"]), false);
  t.pass();
});
test("isSuperset(a, b) - a.b ⊉ a", t => {
  t.is(isSuperset(["a", "b"], ["a"]), false);
  t.pass();
});
test("isSuperset(a, b) - a ⊇ a", t => {
  t.is(isSuperset(["a"], ["a"]), true);
  t.pass();
});
test("isSuperset(a, b) - * ⊇ *", t => {
  t.is(isSuperset([AnySingle], ["a"]), true);
  t.pass();
});
test("isSuperset(a, b) - * ⊉ a", t => {
  t.is(isSuperset(["a"], [AnySingle]), false);
  t.pass();
});
test("isSuperset(a, b) - a ⊉ **", t => {
  t.is(isSuperset(["a"], [AnyMultiple]), false);
  t.pass();
});
test("isSuperset(a, b) - ** ⊇ a", t => {
  t.is(isSuperset([AnyMultiple], ["a"]), true);
  t.pass();
});
test("isSuperset(a, b) - ** ⊇ a.b", t => {
  t.is(isSuperset([AnyMultiple], ["a", "b"]), true);
  t.pass();
});
test("isSuperset(a, b) - ** ⊇ *", t => {
  t.is(isSuperset([AnyMultiple], [AnySingle]), true);
  t.pass();
});
test("isSuperset(a, b) - * ⊉ **", t => {
  t.is(isSuperset([AnySingle], [AnyMultiple]), false);
  t.pass();
});
test("isSuperset(a, b) - **.b ⊉ a.**", t => {
  t.is(isSuperset([AnyMultiple, "b"], ["a", AnyMultiple]), false);
  t.pass();
});
test("isSuperset(a, b) - a.** ⊉ **.b", t => {
  t.is(isSuperset(["a", AnyMultiple], [AnyMultiple, "b"]), false);
  t.pass();
});
test("isSuperset(a, b) - a.**.b ⊉ a.b", t => {
  t.is(isSuperset(["a", AnyMultiple, "b"], ["a", "b"]), false);
  t.pass();
});
test("isSuperset(a, b) - a.b ⊉ a.**.b", t => {
  t.is(isSuperset(["a", "b"], ["a", AnyMultiple, "b"]), false);
  t.pass();
});

test("getIntersection(a, b) - should find intersection of equal literals", t => {
  t.deepEqual(getIntersection(["a"], ["a"]), [["a"]]);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of unequal literals", t => {
  t.deepEqual(getIntersection(["a"], ["b"]), []);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of patterns of different cardinality (a < b)", t => {
  t.deepEqual(getIntersection(["a"], ["a", "b"]), []);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of patterns of different cardinality (a > b)", t => {
  t.deepEqual(getIntersection(["a", "b"], ["b"]), []);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of multi-segment patterns", t => {
  t.deepEqual(getIntersection(["a", "b", "c"], ["a", "b", "c"]), [
    ["a", "b", "c"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnySingle with a literal (* ∩ a)", t => {
  t.deepEqual(getIntersection([AnySingle], ["a"]), [["a"]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnySingle with a literal (a ∩ *)", t => {
  t.deepEqual(getIntersection(["a"], [AnySingle]), [["a"]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnySingle and AnySingle", t => {
  t.deepEqual(getIntersection([AnySingle], [AnySingle]), [[AnySingle]]);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of patterns of different cardinality (* ∩ a.b)", t => {
  t.deepEqual(getIntersection([AnySingle], ["a", "b"]), []);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of patterns of different cardinality (a ∩ *.b)", t => {
  t.deepEqual(getIntersection(["a"], [AnySingle, "b"]), []);
  t.pass();
});
test("getIntersection(a, b) - should not find intersection of patterns of different cardinality (a ∩ a.*)", t => {
  t.deepEqual(getIntersection(["a"], ["a", AnySingle]), []);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of multi-segment patterns (*.b.c ∩ a.b.c)", t => {
  t.deepEqual(getIntersection([AnySingle, "b", "c"], ["a", "b", "c"]), [
    ["a", "b", "c"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of multi-segment patterns (a.*.c ∩ a.b.c)", t => {
  t.deepEqual(getIntersection(["a", AnySingle, "c"], ["a", "b", "c"]), [
    ["a", "b", "c"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of multi-segment patterns (a.b.* ∩ a.b.c)", t => {
  t.deepEqual(getIntersection(["a", "b", AnySingle], ["a", "b", "c"]), [
    ["a", "b", "c"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of multi-segment patterns (*.b.c ∩ *.b.c)", t => {
  t.deepEqual(getIntersection([AnySingle, "b", "c"], [AnySingle, "b", "c"]), [
    [AnySingle, "b", "c"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a literal (** ∩ a)", t => {
  t.deepEqual(getIntersection([AnyMultiple], ["a"]), [["a"]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a literal (a ∩ **)", t => {
  t.deepEqual(getIntersection(["a"], [AnyMultiple]), [["a"]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a AnySingle (** ∩ *)", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnySingle]), [[AnySingle]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a AnySingle (* ∩ **)", t => {
  t.deepEqual(getIntersection([AnySingle], [AnyMultiple]), [[AnySingle]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a AnyMultiple", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnyMultiple]), [[AnyMultiple]]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with more than one AnyMultiple (* ∩ **)", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnyMultiple, AnyMultiple]), [
    [AnySingle, AnyMultiple]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with more than one AnyMultiple (** ∩ *)", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnyMultiple, AnyMultiple]), [
    [AnySingle, AnyMultiple]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a left constraint", t => {
  t.deepEqual(getIntersection([AnyMultiple], ["a", AnyMultiple]), [
    ["a", AnyMultiple]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a right constraint", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnyMultiple, "b"]), [
    [AnyMultiple, "b"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with left and right constraints", t => {
  t.deepEqual(getIntersection([AnyMultiple], ["a", AnyMultiple, "b"]), [
    ["a", AnyMultiple, "b"]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with a center constraint", t => {
  t.deepEqual(getIntersection([AnyMultiple], [AnyMultiple, "b", AnyMultiple]), [
    [AnyMultiple, "b", AnyMultiple]
  ]);
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with opposing constraints", t => {
  t.deepEqual(
    getIntersection([AnyMultiple, "b"], ["a", AnyMultiple]).sort(compare),
    [["a", "b"], ["a", AnyMultiple, "b"]]
  );
  t.pass();
});
test("getIntersection(a, b) - should find intersection of AnyMultiple with staggered constraints", t => {
  t.deepEqual(
    getIntersection(
      [AnyMultiple, "b", AnyMultiple],
      [AnyMultiple, "a", AnyMultiple]
    ).sort(compare),
    [
      [AnyMultiple, "a", AnyMultiple, "b", AnyMultiple],
      [AnyMultiple, "a", "b", AnyMultiple],
      [AnyMultiple, "b", AnyMultiple, "a", AnyMultiple],
      [AnyMultiple, "b", "a", AnyMultiple]
    ]
  );
  t.pass();
});
