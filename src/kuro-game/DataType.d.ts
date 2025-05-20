export declare interface KuroWikiGameData {
	code: number;
	msg: string;
	data: {
		id: number;
		contentJson: {
			feedback: any[];
			background: any;
			mainModules: any[];
			shortcuts: any;
			banner: any[];
			sideModules: {
				id: string;
				title: string;
				content: ActivityInfo[];
				more: {
					linkConfig: ActivityInfo['linkConfig'];
				};
			}[];
			announcement: any[];
		};
	};
}

export interface ActivityInfo {
	linkConfig: {
		/**
		 * 链接 URL
		 */
		linkUrl: string;

		/**
		 * 链接类型
		 */
		linkType: number;

		/**
		 * 入口 ID
		 */
		entryId?: string;

		catalogueId?: number;
	};
	contentUrl: string;
	contentUrlRealName: string;

	/**
	 * 活动是否活跃
	 */
	active: boolean;

	/**
	 * 倒计时信息
	 */
	countDown?: {
		/**
		 * 日期范围
		 */
		dateRange: [string, string];

		/**
		 * 重复设置
		 */
		repeat: {
			endDate: string;

			/**
			 * 是否永远不会结束
			 */
			isNeverEnd: boolean;

			/**
			 * 重复间隔
			 */
			repeatInterval: number;

			/**
			 * 数据范围数组
			 */
			dataRanges: {
				/**
				 * 进度类型
				 */
				progressType: number;
				dataRange: [string, string];
				title: string;
			}[];
		};

		/**
		 * 计数精度
		 */
		precision: 'minute' | 'hour' | 'day';

		/**
		 * 类型 - 无重复
		 */
		type: 'no-repeat';
	};

	/**
	 * 活动标题
	 */
	title: string;
}
