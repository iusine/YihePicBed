<template>
  <div class="help-page">
    <div class="page-head">
      <div class="page-title">使用帮助</div>
      <div class="page-desc">三步完成：创建 GitHub 仓库 → 生成 Token → 配置并上传。</div>
    </div>

    <div class="panel panel-pad">
      <el-steps :active="active" finish-status="success" align-center>
        <el-step title="创建 GitHub 仓库"></el-step>
        <el-step title="生成 GitHub Token"></el-step>
        <el-step title="使用"></el-step>
      </el-steps>

      <div class="help-body">
        <div v-if="active === 0">
          <h3><el-link href="https://github.com/new" target="_blank" type="primary">创建一个仓库</el-link> 作为图床</h3>
          <img class="help-img" src="@/assets/help_images/new-repos.png" />
        </div>

        <div v-if="active === 1">
          <h3>生成 Token</h3>
          <p>1. 打开链接
            <el-link href="https://github.com/settings/tokens" target="_blank" type="primary">https://github.com/settings/tokens</el-link>
            点击 <b>Generate new token</b> 按钮
          </p>
          <p>2. 在打开的 <b>New personal access token</b> 中勾选 <b>"public_repo"</b>，如下所示：</p>
          <img class="help-img" src="@/assets/help_images/generate-token.png" />
          <p>3. 点击 <b>Generate token</b> 按钮即可生成一个 token，如下：</p>
          <img class="help-img" src="@/assets/help_images/token.png" />
          <p class="warn-text"><b>4. 生成的 TOKEN 只会显示一次，记得保存！！</b></p>
        </div>

        <div v-if="active === 2">
          <h3>使用</h3>
          <p>在「图床配置」中填写 Token 并点击查询：</p>
          <img class="help-img" src="@/assets/help_images/setting-token.png" />
          <p>在「图床管理」中选择仓库/目录，点击查询查看图片：</p>
          <img class="help-img" src="@/assets/help_images/search.jpg" />
          <p>点击「上传」添加文件：</p>
          <img class="help-img" src="@/assets/help_images/upload.jpg" />
        </div>

        <div v-if="active === 3">
          <h2>OK！恭喜你完成使用教程！</h2>
        </div>
      </div>

      <div class="help-footer">
        <el-button v-if="active !== 0" type="primary" plain @click="prev">上一步</el-button>
        <el-button v-if="active !== 3" type="primary" @click="next">下一步</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Help",
  data() {
    return {
      active: 0
    }
  },
  methods: {
    next() {
      this.active++
      if (this.active === 3) {
        this.msgSuccess('恭喜你完成教程')
      }
    },
    prev() {
      this.active--
    }
  }
}
</script>

<style lang="scss" scoped>
.help-body {
  margin-top: 28px;
  text-align: center;

  h2 {
    color: var(--text-1);
  }

  h3 {
    color: var(--text-1);
  }

  p {
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.8;
  }

  .warn-text {
    color: var(--el-color-danger);
  }

  .help-img {
    max-width: 720px;
    width: 100%;
    border-radius: 18px;
    border: 1px solid var(--line);
    box-shadow: var(--shadow-pop);
  }

  :deep(.el-link) {
    font-size: inherit;
  }
}

.help-footer {
  margin-top: 24px;
  text-align: center;
}
</style>
