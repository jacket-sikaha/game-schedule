export declare interface BAData {
	code: number;
	msg: string;
	data: {
		rows: { id: number; title: string; banner: string; content: string; type: string; publishTime: number; description: string }[];
		count: number;
	};
}
