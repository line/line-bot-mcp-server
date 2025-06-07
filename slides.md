---
marp: true
size: 16:9
---


<style>
section {
  padding: 0 !important;
  background-color: lightyellow;
  height: 100% !important;
}

/*
   スライド内の最初の要素が持つ上マージンや、
   最後の要素が持つ下マージンも消したい場合に追加すると、
   より端までコンテンツが配置されます。
*/
section > :first-child {
  margin-top: 0 !important;
}
section > :last-child {
  margin-bottom: 0 !important;
}

/* 横並びレイアウトのためのコンテナ */
.columns-container {
  display: flex;
  flex-wrap: wrap; /* 折り返しを有効に */
  width: 100%;
  height: 100%;
}

/* 横並びにする各アイテム */
.column-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 0 0 33.3333%;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 15px;
  box-sizing: border-box;
}
</style>

<div class="columns-container">
  <div class="column-item">
    <h3>アイテム 1</h3>
  </div>
  <div class="column-item">
    <h3>アイテム 2</h3>
  </div>
  <div class="column-item">
    <h3>アイテム 3</h3>
  </div>
  <div class="column-item">
    <h3>アイテム 1</h3>
  </div>
  <div class="column-item">
    <h3>アイテム 2</h3>
  </div>
  <div class="column-item">
    <h3>アイテム 3</h3>
  </div>
</div>
