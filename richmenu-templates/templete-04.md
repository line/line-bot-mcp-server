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
  font-size: 50px;
  white-space: normal;
  word-break: break-all;
}
.column-item-04 {
  height: calc((100% - 30px) / 2);
  width: calc((100% - 30px) / 2);
}
.column-item-04-top {
  margin: 10px 0px 0px 10px;
}
.column-item-04-bottom {
  margin: 0px 0px 0px 10px;
}
</style>
<div class="columns-container">
  <div class="column-item column-item-04 column-item-04-top">
    <h3>item01</h3>
  </div>
  <div class="column-item column-item-04 column-item-04-top">
    <h3>item02</h3>
  </div>
  <div class="column-item column-item-04 column-item-04-bottom">
    <h3>item03</h3>
  </div>
  <div class="column-item column-item-04 column-item-04-bottom">
    <h3>item04</h3>
  </div>
</div>
