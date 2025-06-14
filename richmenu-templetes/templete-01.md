---
marp: true
size: 16:9
---

<style>
section {
  padding: 0 !important;
  background-color: orange;
  height: 100% !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.columns-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
}
.column-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  box-sizing: border-box;
  overflow: hidden;
}
.column-item h3 {
  font-weight: bold;
  width: 100%;
  text-align: center;
  font-size: clamp(16px, 6vw, 50px);
  white-space: normal;
  word-break: break-all;
}
.column-item-01 {
  margin: 10px;
  height: calc((100% - 20px));
  width: calc((100% - 20px));
}
</style>

<div class="columns-container">
  <div class="column-item column-item-01">
    <h3>item01</h3>
  </div>
</div>
