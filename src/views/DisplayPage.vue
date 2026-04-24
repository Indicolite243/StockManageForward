<template>
  <div class="display-page">
    <div class="grid-background"></div>

    <div class="content-wrapper">
      <div class="left-section glass-panel">
        <div class="panel-header">
          <div class="header-line"></div>
          <h3 class="panel-title">
            <i class="title-icon"></i>
            资产展示
          </h3>
          <div class="status-indicator"></div>
        </div>
        <div class="panel-content">
          <AssetDisplayModule />
        </div>
        <div class="panel-footer">
          <div class="footer-decoration"></div>
        </div>
      </div>

      <div class="right-section">
        <div class="strategy-intro-panel glass-panel">
          <div class="panel-header">
            <div class="header-line"></div>
            <h3 class="panel-title">
              <i class="title-icon"></i>
              策略简介
            </h3>
            <div class="status-indicator"></div>
          </div>
          <div class="panel-content">
            <StrategyExecution />
          </div>
          <div class="panel-footer">
            <div class="footer-decoration"></div>
          </div>
        </div>

        <div class="strategy-result-panel glass-panel">
          <div class="panel-header">
            <div class="header-line"></div>
            <h3 class="panel-title">
              <i class="title-icon"></i>
              策略执行结果图
            </h3>
            <div class="status-indicator"></div>
          </div>
          <div class="panel-content">
            <StrategyExecutionResult />
          </div>
          <div class="panel-footer">
            <div class="footer-decoration"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="floating-decorations">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
      <div class="decoration-orb orb-3"></div>
    </div>
  </div>
</template>

<script>
import AssetDisplayModule from '@/components/layout/AssetDisplayModule.vue'
import StrategyExecution from '@/components/layout/StrategyExecution.vue'
import StrategyExecutionResult from '@/components/layout/StrategyExecutionResult.vue'

export default {
  name: 'DisplayPage',
  components: {
    AssetDisplayModule,
    StrategyExecution,
    StrategyExecutionResult
  }
}
</script>

<style scoped>
.display-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 140px);
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
  z-index: 2;
}

.grid-background {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(64, 224, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 224, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
  pointer-events: none;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.content-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 20px;
  z-index: 3;
}

.glass-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  background: rgba(12, 20, 38, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(64, 224, 255, 0.3);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(64, 224, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.left-section {
  width: 38%;
  min-width: 380px;
  overflow: auto;
}

.right-section {
  width: 62%;
  min-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.strategy-intro-panel {
  height: 50%;
  min-height: 360px;
}

.strategy-result-panel {
  height: 50%;
  min-height: 460px;
}

.panel-header {
  position: relative;
  padding: 15px 20px;
  background: linear-gradient(135deg,
    rgba(64, 224, 255, 0.1) 0%,
    rgba(30, 144, 255, 0.05) 100%);
  border-bottom: 1px solid rgba(64, 224, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(64, 224, 255, 0.5);
}

.title-icon {
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #40e0ff, #1e90ff);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(64, 224, 255, 0.8);
}

.header-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(64, 224, 255, 0.8) 50%,
    transparent 100%);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #7bff9e;
  box-shadow: 0 0 12px rgba(123, 255, 158, 0.9);
}

.panel-content {
  flex: 1;
  min-height: 0;
  padding: 12px;
}

.panel-footer {
  height: 2px;
}

.footer-decoration {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(64, 224, 255, 0.4) 50%,
    transparent 100%);
}

.floating-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.decoration-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(64, 224, 255, 0.12) 0%, transparent 70%);
}

.orb-1 {
  width: 220px;
  height: 220px;
  top: 10%;
  right: 8%;
}

.orb-2 {
  width: 180px;
  height: 180px;
  bottom: 12%;
  left: 42%;
}

.orb-3 {
  width: 140px;
  height: 140px;
  bottom: 8%;
  right: 10%;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }

  .left-section,
  .right-section {
    width: 100%;
    min-width: 0;
  }

  .right-section {
    height: auto;
  }

  .strategy-intro-panel,
  .strategy-result-panel {
    height: auto;
    min-height: 420px;
  }
}
</style>
