---
marp: true
size: 16:9
---


<style>
section {
  padding: 0 !important;
  background-color: orange;
  height: 100% !important;
}

section > :first-child {
  margin-top: 0 !important;
}
section > :last-child {
  margin-bottom: 0 !important;
}

.flex-container {
  display: flex;
  width: 100%;
  height: 400px;   gap: 10px;
  height: 100%;
}

.flex-left {
  flex: 2;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  border: 1px solid #ccc;
  margin: 10px 0px 10px 10px;
}

.flex-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.flex-right-top-item {
  flex: 1;
  background: white;
  margin: 10px 10px 0px 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  border: 1px solid #ccc;
}

.flex-right-bottom-item {
  flex: 1;
  background: white;
  margin: 0px 10px 10px 0px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  border: 1px solid #ccc;
}
</style>
<div class="flex-container">
  <div class="flex-left">item01</div>
  <div class="flex-right">
    <div class="flex-right-top-item">item02</div>
    <div class="flex-right-bottom-item">item03</div>
  </div>
</div>
