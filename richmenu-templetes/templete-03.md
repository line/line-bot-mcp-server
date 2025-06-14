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
.column-item-03-01 {
  flex: 2;
  margin: 10px 0px 10px 10px;
}

.column-item-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.column-item-03-02 {
  flex: 1;
  margin: 10px 10px 10px 10px;
}

.column-item-03-03 {
  flex: 1;
  margin: 0px 10px 10px 10px;
}

</style>
<div class="columns-container">
  <div class="column-item column-item-03-01">
    <h3>item01</h3>
  </div>
  <div class="column-item-right">
    <div class="column-item column-item-03-02">
      <h3>item02</h3>
    </div>
    <div class="column-item column-item-03-03">
      <h3>item03</h3>
    </div>
  </div>
</div>
