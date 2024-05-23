<script setup lang="ts">
import { LandscapeView } from '@orginjs/oss-evaluation-components/landscape-view';
import projects from './projects.json';

interface Project {
  category: string;
  subcategory: string;
  name: string;
  description: string;
  htmlUrl: string;
  logo: string;
  starCount: number;
  forksCount: number;
}

const landscapeOptions = {
  maxProjects: 100, //非必填，指定子技术栈超过多少个项目就不再展示
  colors: ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'], //非必填，自定义背景色，按顺序使用
  layout: {   //非必填，布局。 但是建议传，当前自动计算布局不好看，数字为占一行的列宽，相加超过1就会在下一行显示
    "Application": {
      "UI库": 0.7,
      "图表库": 0.3,
      "编辑器": 0.55,
      "图形处理": 0.45
    },
    "Frameworks": {
      "前端框架": 0.45,
      "移动端框架": 0.35,
      "状态管理": 0.2,
      "前端框架生态": 0.55,
      "服务端框架": 0.3,
      "CSS框架": 0.15
    },
    "Library": {
      "解析器": 0.55,
      "字符串": 0.25,
      "微前端": 0.2,
      "函数库": 0.6,
      "模板引擎": 0.2,
      "Serverless": 0.2,
      "网络": 0.6,
      "压缩": 0.25,
      "polyfill": 0.15,
      "音视频": 0.73,
      "日期时间": 0.27,
      "加解密": 0.7,
      "Web Components": 0.3
    },
    "Develop": {
      "构建工具": 0.5,
      "开发工具": 0.3,
      "CSS预处理": 0.2
    },
    "Runtime": {
      "Runtime": 1
    }
  }
};

function clickMore(category: string, subcategory: string) {
  alert(`clickMore: ${category}:${subcategory}`);
}

function clickProject(project: Project) {
  alert(`clickProject: ${project.name} -- ${project.htmlUrl}`);
}
</script>

<template>
  <div class="min-h-[calc(100vh-177px)]" flex justify-center pt-10 bg-light-300>
    <LandscapeView style="width: 1280px;" :projects="projects" :options="landscapeOptions" @go-more="clickMore"
      @click-project="clickProject" />
  </div>
</template>

<style scoped lang="less"></style>
