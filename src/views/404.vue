<template>
	<div class="wscn-http404-container">
		<div class="wscn-http404">
			<div class="pic-404">
				<div class="pic-404__frame">
					<img class="pic-404__parent" src="@/assets/404_images/404.png" alt="404">
					<img class="pic-404__child left" src="@/assets/404_images/404_cloud.png" alt="">
					<img class="pic-404__child mid" src="@/assets/404_images/404_cloud.png" alt="">
					<img class="pic-404__child right" src="@/assets/404_images/404_cloud.png" alt="">
				</div>
			</div>
			<div class="bullshit">
				<div class="bullshit__oops">404</div>
				<div class="bullshit__headline">页面走丢了</div>
				<div class="bullshit__info">链接可能已失效，或你访问的地址不存在。回到图床继续管理你的图片吧。</div>
				<a href="#/" class="bullshit__return-home">回到图床</a>
			</div>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'Page404'
	}
</script>

<style lang="scss" scoped>
	.wscn-http404-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 24px;
	}

	.wscn-http404 {
		display: flex;
		align-items: center;
		gap: 36px;
		width: min(1000px, 100%);
		padding: 36px;
		overflow: hidden;
		background: var(--bg-glass);
		border: 1px solid var(--line);
		border-radius: 32px;
		box-shadow: var(--shadow-card);
	}

	.pic-404 {
		position: relative;
		flex: 0 1 58%;
		min-width: 0;

		&__frame {
			position: relative;
			padding: 10px;
			background: #ffffff;
			border-radius: 24px;
			box-shadow: 0 24px 50px -30px rgba(2, 6, 23, 0.55);
		}

		&__parent {
			display: block;
			width: 100%;
			border-radius: 16px;
		}

		&__child {
			position: absolute;

			&.left {
				width: 80px;
				top: 17px;
				left: 36%;
				opacity: 0;
				animation: cloudLeft 2s linear 1s forwards;
			}

			&.mid {
				width: 46px;
				top: 10px;
				left: 70%;
				opacity: 0;
				animation: cloudMid 2s linear 1.2s forwards;
			}

			&.right {
				width: 62px;
				top: 100px;
				left: 84%;
				opacity: 0;
				animation: cloudRight 2s linear 1s forwards;
			}

			@keyframes cloudLeft {
				0% {
					top: 17px;
					left: 36%;
					opacity: 0;
				}
				20% {
					top: 33px;
					left: 30%;
					opacity: 1;
				}
				80% {
					top: 81px;
					left: 14%;
					opacity: 1;
				}
				100% {
					top: 97px;
					left: 8%;
					opacity: 0;
				}
			}

			@keyframes cloudMid {
				0% {
					top: 10px;
					left: 70%;
					opacity: 0;
				}
				20% {
					top: 40px;
					left: 60%;
					opacity: 1;
				}
				70% {
					top: 130px;
					left: 30%;
					opacity: 1;
				}
				100% {
					top: 160px;
					left: 20%;
					opacity: 0;
				}
			}

			@keyframes cloudRight {
				0% {
					top: 100px;
					left: 84%;
					opacity: 0;
				}
				20% {
					top: 120px;
					left: 77%;
					opacity: 1;
				}
				80% {
					top: 180px;
					left: 57%;
					opacity: 1;
				}
				100% {
					top: 200px;
					left: 50%;
					opacity: 0;
				}
			}
		}
	}

	.bullshit {
		flex: 1;
		min-width: 0;

		&__oops {
			font-family: var(--font-display);
			font-size: 64px;
			line-height: 1;
			letter-spacing: 0.02em;
			background: var(--title-grad);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
			opacity: 0;
			animation: slideUp 0.5s ease forwards;
		}

		&__headline {
			margin-top: 14px;
			font-size: 22px;
			font-weight: 600;
			color: var(--text-1);
			opacity: 0;
			animation: slideUp 0.5s ease 0.1s forwards;
		}

		&__info {
			margin-top: 10px;
			max-width: 340px;
			font-size: 13px;
			line-height: 1.8;
			color: var(--text-3);
			opacity: 0;
			animation: slideUp 0.5s ease 0.2s forwards;
		}

		&__return-home {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			margin-top: 26px;
			padding: 10px 24px;
			border: 1px solid rgba(255, 255, 255, 0.24);
			border-radius: 12px;
			background: linear-gradient(135deg, var(--brand), var(--brand-2));
			box-shadow: 0 12px 28px -14px color-mix(in srgb, var(--brand) 85%, transparent);
			color: var(--brand-ink);
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			opacity: 0;
			animation: slideUp 0.5s ease 0.3s forwards;
			transition: filter 0.2s ease, transform 0.2s ease;

			&:hover {
				filter: brightness(1.07);
				transform: translateY(-1px);
			}
		}

		@keyframes slideUp {
			0% {
				transform: translateY(24px);
				opacity: 0;
			}
			100% {
				transform: translateY(0);
				opacity: 1;
			}
		}
	}

	@media (max-width: 760px) {
		.wscn-http404 {
			flex-direction: column;
			gap: 24px;
			padding: 22px;
			border-radius: 24px;
			text-align: center;
		}

		.pic-404 {
			flex: 0 0 auto;
			width: 100%;
		}

		.bullshit__info {
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
