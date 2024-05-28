export interface QueryIdsRequest {
  ids: number[];
}

export interface SingleIdResponse {
  id: number;
  name: string;
  source: string;
  created: Date;
  num_frames: number;
  num_channels: number;
  sample_rate: number;
  duration: number;
}

export interface QueryIdsResponse {
  infos: SingleIdResponse[];
}
