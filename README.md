# mini ecommerce
Video demo [Ecommerce https://youtu.be/ZZ3-H1e_8kE](https://youtu.be/ZZ3-H1e_8kE)
<hr/>

## I. Setup project
```diff
git clone https://github.com/studev1922/ecommerce.git
```
- Clone by git as above or dowload file [ecommerce.zip](../../archive/refs/heads/main.zip) and unzip the file.
- Open TERMINAL or CMD pointing into folder has been cloned or extracted `EX: cd D:/vscode_workspace/ecommerce`. Install all packages("dependencies")
```diff
cd ./ecommerce
```
Run this file to create database mssql(SQL server)<br/>
`run file database ...`[ecommerce/ecommerce.sql](./ecommerce.sql)

## I.1 Start server
- `npm start` to run server api
```diff
cd ./server | npm install | npm start
```
## I.2 Start client
- `npm start` to run client displays
```diff
cd ./client | npm install | npm start
```
`npm test - npm run build - npm run eject`
<hr/>

<div class="video">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/ZZ3-H1e_8kE" 
          title="YouTube video player" frameborder="0" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
  </iframe>
</div>
<style>
.video {
  width: 100%;
  height: 200px;
  border: 1px solid red;
  overflow: hidden;
  position: relative;
}
iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
