<script setup lang="ts">
const features = ref([
  {
    icon: 'ELIConSearch',
    title: '性能 Benchmark',
    details: '10+ 前端子技术线性能 Benchmark 评测，权威对比分析，方便您更好选型',
  },
  {
    icon: 'ELIConSearch',
    title: 'Landscape',
    details: '包含前端 9k+ 软件，全面分类整理，数字化呈现 20+ 子技术栈',
  },
  {
    icon: 'ELIConSearch',
    title: '先进性评估',
    details: '功能、性能、生态、质量、创新多维度数字化画像，一键自动化生成评估报告',
  },
])
</script>

<template>
  <div class="home">
    <div class="intro">
      <div class="intro-wrapper">
        <div class="main">
          <h1 class="name"><span class="clip">OSS Evaluation</span></h1>
          <p class="text">前端先进性评估</p>
          <p class="tagline">前端先进性评估</p>
          <div class="actions">
            <!--      todo 公共搜索组件 -->
            <button class="search-btn">
              <span class="content">
                <img src="/navigation/search.svg" alt="search">
                <span class="desc">搜索开源项目</span>
              </span>
            </button>
          </div>
        </div>
        <div class="image">
          <div class="image-wrapper">
            <div class="image-bg"></div>
            <img src="/common/logo.png" alt="logo" class="image-src">
          </div>
        </div>
      </div>
    </div>
    <div class="features">
      <div class="features-wrapper">
        <div class="items">
          <div class="item" v-for="item in features">
            <div class="item-wrapper">
              <el-icon class="icon"><el-icon-link/></el-icon>
              <div class="title">{{ item.title }}</div>
              <div class="details">{{ item.details }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home {
  margin-bottom: 108px;
}

.intro {
  margin-top: -64px;
  padding: 144px 64px 64px;
}

.intro-wrapper {
  display: flex;
  margin: 0 auto;
  max-width: 1200px;

  .main {
    width: calc((100% / 3) * 2);
    max-width: 592px;
    text-align: left;

    .name, .text, .tagline, .actions {
      width: 100%;
    }

    .clip {
      background-image: linear-gradient(74deg, #4d93fb 16%, #ff2992);
      background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -.4px;
      line-height: 64px;
      font-size: 56px;
      font-weight: 700;
    }

    .text {
      line-height: 64px;
      font-size: 56px;
      letter-spacing: -.4px;
      font-weight: 700;
      color: rgba(60, 60, 67)
    }

    .tagline {
      padding-top: 12px;
      color: rgba(60, 60, 67, .78);
      font-weight: 500;
      line-height: 36px;
      font-size: 24px;
    }

    .actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      padding-top: 32px;

      .search-btn {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        height: 40px;
        width: 280px;
        background-color: #f6f6f7;
        cursor: pointer;
        outline: none;
        border: 1px solid transparent;
        color: rgba(0, 0, 0, 0.75);

        &:hover {
          border-color: #3451b2;
        }

        .content {
          display: flex;
          align-items: center;

          .desc {
            margin-left: 6px;
          }
        }
      }
    }
  }

  .image {
    position: relative;
    flex: 1;
  }

  .image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translate(-32px, -32px);

    .image-bg, .image-src {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .image-bg {
      border-radius: 50%;
      background-image: linear-gradient(74deg, #4d93fb 16%, #ff2992);
      filter: blur(68px);
      height: 320px;
      width: 320px;
    }

    .image-src {
      height: 260px;
      width: 260px;
    }
  }
}

.features {
  padding: 0 64px;
}

.features-wrapper {
  margin: 0 auto;
  max-width: 1200px;

  .items {
    display: flex;
    flex-wrap: wrap;
    //margin-top: -8px;

    .item {
      padding: 8px;
      width: 25%;
    }

    .item-wrapper {
      display: flex;
      flex-direction: column;
      padding: 24px;
      border-radius: 12px;
      background-color: #f6f6f7;
      height: 100%;

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 20px;
        border-radius: 6px;
        background-color: rgba(142, 150, 170, .14);
        width: 48px;
        height: 48px;
        font-size: 24px;
      }

      .title {
        line-height: 24px;
        font-size: 16px;
        font-weight: 600;
      }

      .details {
        flex: 1;
        padding-top: 8px;
        line-height: 24px;
        font-size: 14px;
        font-weight: 500;
        color: rgba(60, 60, 67, .78);
      }
    }
  }
}
</style>