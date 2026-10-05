/* ===== NeuroViz – 多图谱分区数据 =====
 * 本文件由 generate_atlas_objs.py / prepare_atlases.py 根据 FreeSurfer fsaverage
 * 高分辨率表面与各权威分区标注自动生成。请勿手动修改颜色，否则 3D 模型与
 * 图例会出现不一致。
 */

window.ATLAS_METADATA = {
    hcp_mmp: {
        name: 'HCP MMP 1.0',
        fullName: 'HCP MMP 1.0 (360区)',
        citation: 'Glasser et al., 2016, Nature',
        description: '360 皮层分区'
    },
    desikan: {
        name: 'Desikan-Killiany',
        fullName: 'Desikan-Killiany (68区)',
        citation: 'Desikan et al., 2006, NeuroImage',
        description: '68 皮层分区'
    },
    destrieux: {
        name: 'Destrieux',
        fullName: 'Destrieux (148区)',
        citation: 'Destrieux et al., 2010, NeuroImage',
        description: '148 皮层分区'
    },
    yeo7: {
        name: 'Yeo 7Networks',
        fullName: 'Yeo 2011 7Networks (7网络)',
        citation: 'Yeo et al., 2011, J Neurophysiol',
        description: '7 个静息态功能网络'
    }
};

window.ATLAS_REGIONS = {
  "hcp_mmp": [
    {
      "id": "L_V1_ROI",
      "name": "左初级视皮层 V1",
      "color": "#3F05FF",
      "lobe": "occipital",
      "aliases": [
        "左初级视皮层",
        "左V1",
        "初级视皮层",
        "V1"
      ],
      "hemi": "left",
      "label_id": 1
    },
    {
      "id": "L_MST_ROI",
      "name": "左内侧上颞区 MST",
      "color": "#366781",
      "lobe": "temporal",
      "aliases": [
        "左上颞",
        "上颞"
      ],
      "hemi": "left",
      "label_id": 2
    },
    {
      "id": "L_V6_ROI",
      "name": "左第六视皮层 V6",
      "color": "#3E4EB2",
      "lobe": "occipital",
      "aliases": [
        "左V6",
        "V6"
      ],
      "hemi": "left",
      "label_id": 3
    },
    {
      "id": "L_V2_ROI",
      "name": "左次级视皮层 V2",
      "color": "#1732E9",
      "lobe": "occipital",
      "aliases": [
        "左V2",
        "V2"
      ],
      "hemi": "left",
      "label_id": 4
    },
    {
      "id": "L_V3_ROI",
      "name": "左第三视皮层 V3",
      "color": "#0F28E2",
      "lobe": "occipital",
      "aliases": [
        "左V3",
        "V3"
      ],
      "hemi": "left",
      "label_id": 5
    },
    {
      "id": "L_V4_ROI",
      "name": "左第四视皮层 V4",
      "color": "#0E1CD6",
      "lobe": "occipital",
      "aliases": [
        "左V4",
        "V4"
      ],
      "hemi": "left",
      "label_id": 6
    },
    {
      "id": "L_V8_ROI",
      "name": "左第八视皮层 V8",
      "color": "#1A2FC9",
      "lobe": "occipital",
      "aliases": [
        "左V8",
        "V8"
      ],
      "hemi": "left",
      "label_id": 7
    },
    {
      "id": "L_4_ROI",
      "name": "左中央前回 4",
      "color": "#21B214",
      "lobe": "frontal",
      "aliases": [
        "左中央前回",
        "左运动皮层",
        "左初级运动",
        "中央前回",
        "运动皮层",
        "初级运动"
      ],
      "hemi": "left",
      "label_id": 8
    },
    {
      "id": "L_3b_ROI",
      "name": "左中央后回 3b 区",
      "color": "#23CD15",
      "lobe": "parietal",
      "aliases": [
        "左中央后回",
        "左体感",
        "中央后回",
        "体感"
      ],
      "hemi": "left",
      "label_id": 9
    },
    {
      "id": "L_FEF_ROI",
      "name": "左额眼区",
      "color": "#868F89",
      "lobe": "frontal",
      "aliases": [
        "左额眼区",
        "左FEF",
        "额眼区",
        "FEF"
      ],
      "hemi": "left",
      "label_id": 10
    },
    {
      "id": "L_PEF_ROI",
      "name": "左后眼区 PEF",
      "color": "#8DA698",
      "lobe": "frontal",
      "aliases": [
        "左眼区",
        "眼区"
      ],
      "hemi": "left",
      "label_id": 11
    },
    {
      "id": "L_55b_ROI",
      "name": "左岛叶 55b 区",
      "color": "#3E582F",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 12
    },
    {
      "id": "L_V3A_ROI",
      "name": "左第三视皮层 A V3A",
      "color": "#0739F6",
      "lobe": "occipital",
      "aliases": [
        "左V3A",
        "V3A"
      ],
      "hemi": "left",
      "label_id": 13
    },
    {
      "id": "L_RSC_ROI",
      "name": "左压后皮层 RSC",
      "color": "#994085",
      "lobe": "parietal",
      "aliases": [
        "左压后",
        "压后"
      ],
      "hemi": "left",
      "label_id": 14
    },
    {
      "id": "L_POS2_ROI",
      "name": "左顶枕沟 2",
      "color": "#BA56BC",
      "lobe": "parietal",
      "aliases": [
        "左顶枕沟",
        "顶枕沟"
      ],
      "hemi": "left",
      "label_id": 15
    },
    {
      "id": "L_V7_ROI",
      "name": "左第七视皮层 V7",
      "color": "#1246C3",
      "lobe": "occipital",
      "aliases": [
        "左V7",
        "V7"
      ],
      "hemi": "left",
      "label_id": 16
    },
    {
      "id": "L_IPS1_ROI",
      "name": "左顶内沟 IPS1",
      "color": "#3972A0",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 17
    },
    {
      "id": "L_FFC_ROI",
      "name": "左梭状回面部区 FFC",
      "color": "#395975",
      "lobe": "temporal",
      "aliases": [
        "左梭状回",
        "左面部",
        "梭状回",
        "面部"
      ],
      "hemi": "left",
      "label_id": 18
    },
    {
      "id": "L_V3B_ROI",
      "name": "左第三视皮层 B V3B",
      "color": "#192FCE",
      "lobe": "occipital",
      "aliases": [
        "左V3B",
        "V3B"
      ],
      "hemi": "left",
      "label_id": 19
    },
    {
      "id": "L_LO1_ROI",
      "name": "左外侧枕叶 1",
      "color": "#0031B8",
      "lobe": "occipital",
      "aliases": [
        "左外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "left",
      "label_id": 20
    },
    {
      "id": "L_LO2_ROI",
      "name": "左外侧枕叶 2",
      "color": "#1221B5",
      "lobe": "occipital",
      "aliases": [
        "左外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "left",
      "label_id": 21
    },
    {
      "id": "L_PIT_ROI",
      "name": "左颞下后部视觉区 PIT",
      "color": "#222BAB",
      "lobe": "temporal",
      "aliases": [
        "左颞下",
        "颞下"
      ],
      "hemi": "left",
      "label_id": 22
    },
    {
      "id": "L_MT_ROI",
      "name": "左中颞区 MT",
      "color": "#1F5668",
      "lobe": "temporal",
      "aliases": [
        "左中颞",
        "左MT",
        "左V5",
        "中颞",
        "MT",
        "V5"
      ],
      "hemi": "left",
      "label_id": 23
    },
    {
      "id": "L_A1_ROI",
      "name": "左初级听皮层 A1",
      "color": "#EB132F",
      "lobe": "temporal",
      "aliases": [
        "左初级听皮层",
        "左A1",
        "初级听皮层",
        "A1"
      ],
      "hemi": "left",
      "label_id": 24
    },
    {
      "id": "L_PSL_ROI",
      "name": "左上顶小叶外侧 PSL",
      "color": "#7A4F38",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 25
    },
    {
      "id": "L_SFL_ROI",
      "name": "左额岛盖沟 SFL",
      "color": "#1F3116",
      "lobe": "temporal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 26
    },
    {
      "id": "L_PCV_ROI",
      "name": "左压后皮层 PCV",
      "color": "#8A8099",
      "lobe": "parietal",
      "aliases": [
        "左压后",
        "压后"
      ],
      "hemi": "left",
      "label_id": 27
    },
    {
      "id": "L_STV_ROI",
      "name": "左颞上视觉区 STV",
      "color": "#8E574C",
      "lobe": "temporal",
      "aliases": [
        "左颞上",
        "颞上"
      ],
      "hemi": "left",
      "label_id": 28
    },
    {
      "id": "L_7Pm_ROI",
      "name": "左顶上小叶后内侧 7Pm",
      "color": "#95B5BC",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 29
    },
    {
      "id": "L_7m_ROI",
      "name": "左顶上小叶内侧 7m",
      "color": "#2A1F2C",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 30
    },
    {
      "id": "L_POS1_ROI",
      "name": "左顶枕沟 1",
      "color": "#513662",
      "lobe": "parietal",
      "aliases": [
        "左顶枕沟",
        "顶枕沟"
      ],
      "hemi": "left",
      "label_id": 31
    },
    {
      "id": "L_23d_ROI",
      "name": "左后扣带回 23d",
      "color": "#7F385B",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 32
    },
    {
      "id": "L_v23ab_ROI",
      "name": "左腹侧后扣带 v23ab",
      "color": "#1D000E",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 33
    },
    {
      "id": "L_d23ab_ROI",
      "name": "左背侧后扣带 d23ab",
      "color": "#3F112F",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 34
    },
    {
      "id": "L_31pv_ROI",
      "name": "左后扣带回 31pv",
      "color": "#360B2A",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 35
    },
    {
      "id": "L_5m_ROI",
      "name": "左旁中央小叶后部 5m",
      "color": "#30A330",
      "lobe": "frontal",
      "aliases": [
        "左旁中央小叶",
        "旁中央小叶"
      ],
      "hemi": "left",
      "label_id": 36
    },
    {
      "id": "L_5mv_ROI",
      "name": "左旁中央小叶后部 5mv",
      "color": "#99AC88",
      "lobe": "frontal",
      "aliases": [
        "左旁中央小叶",
        "旁中央小叶"
      ],
      "hemi": "left",
      "label_id": 37
    },
    {
      "id": "L_23c_ROI",
      "name": "左后扣带回 23c",
      "color": "#CDBEC2",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 38
    },
    {
      "id": "L_5L_ROI",
      "name": "左顶上小叶前外侧 5L",
      "color": "#409A40",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 39
    },
    {
      "id": "L_24dd_ROI",
      "name": "左背侧前扣带回 24dd",
      "color": "#45A12C",
      "lobe": "cingulate",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 40
    },
    {
      "id": "L_24dv_ROI",
      "name": "左腹侧前扣带回 24dv",
      "color": "#779F42",
      "lobe": "cingulate",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 41
    },
    {
      "id": "L_7AL_ROI",
      "name": "左顶上小叶前外侧 7AL",
      "color": "#73C286",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 42
    },
    {
      "id": "L_SCEF_ROI",
      "name": "左辅助眼区",
      "color": "#6E9256",
      "lobe": "frontal",
      "aliases": [
        "左眼区",
        "眼区"
      ],
      "hemi": "left",
      "label_id": 43
    },
    {
      "id": "L_6ma_ROI",
      "name": "左辅助运动区 6ma",
      "color": "#90B387",
      "lobe": "frontal",
      "aliases": [
        "左辅助运动",
        "左SMA",
        "辅助运动",
        "SMA"
      ],
      "hemi": "left",
      "label_id": 44
    },
    {
      "id": "L_7Am_ROI",
      "name": "左顶上小叶前内侧 7Am",
      "color": "#B8F3E0",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 45
    },
    {
      "id": "L_7PL_ROI",
      "name": "左顶上小叶后外侧 7PL",
      "color": "#A9F6ED",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 46
    },
    {
      "id": "L_7PC_ROI",
      "name": "左顶上小叶中央 7PC",
      "color": "#44B16C",
      "lobe": "parietal",
      "aliases": [
        "左顶上小叶",
        "顶上小叶"
      ],
      "hemi": "left",
      "label_id": 47
    },
    {
      "id": "L_LIPv_ROI",
      "name": "左腹侧顶内沟外侧",
      "color": "#3F719E",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 48
    },
    {
      "id": "L_VIP_ROI",
      "name": "左腹顶内沟 VIP",
      "color": "#328189",
      "lobe": "occipital",
      "aliases": [
        "左腹顶内沟",
        "腹顶内沟"
      ],
      "hemi": "left",
      "label_id": 49
    },
    {
      "id": "L_MIP_ROI",
      "name": "左内侧顶内沟 MIP",
      "color": "#88CECC",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 50
    },
    {
      "id": "L_1_ROI",
      "name": "左中央后回 1 区",
      "color": "#14BF26",
      "lobe": "parietal",
      "aliases": [
        "左中央后回",
        "左体感",
        "中央后回",
        "体感"
      ],
      "hemi": "left",
      "label_id": 51
    },
    {
      "id": "L_2_ROI",
      "name": "左中央后回 2 区",
      "color": "#30B03E",
      "lobe": "parietal",
      "aliases": [
        "左中央后回",
        "左体感",
        "中央后回",
        "体感"
      ],
      "hemi": "left",
      "label_id": 52
    },
    {
      "id": "L_3a_ROI",
      "name": "左中央后回 3a 区",
      "color": "#2FD816",
      "lobe": "parietal",
      "aliases": [
        "左中央后回",
        "左体感",
        "中央后回",
        "体感"
      ],
      "hemi": "left",
      "label_id": 53
    },
    {
      "id": "L_6d_ROI",
      "name": "左背外侧前运动区 6d",
      "color": "#1A9E20",
      "lobe": "frontal",
      "aliases": [
        "左前运动",
        "前运动"
      ],
      "hemi": "left",
      "label_id": 54
    },
    {
      "id": "L_6mp_ROI",
      "name": "左辅助运动区内侧 6mp",
      "color": "#409F26",
      "lobe": "frontal",
      "aliases": [
        "左辅助运动",
        "左SMA",
        "辅助运动",
        "SMA"
      ],
      "hemi": "left",
      "label_id": 55
    },
    {
      "id": "L_6v_ROI",
      "name": "左腹侧前运动区 6v",
      "color": "#47A832",
      "lobe": "frontal",
      "aliases": [
        "左前运动",
        "前运动"
      ],
      "hemi": "left",
      "label_id": 56
    },
    {
      "id": "L_p24pr_ROI",
      "name": "左后扣带回前部 p24pr",
      "color": "#92886B",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 57
    },
    {
      "id": "L_33pr_ROI",
      "name": "左旁嗅皮层 33pr",
      "color": "#816A67",
      "lobe": "cingulate",
      "aliases": [
        "左旁嗅",
        "旁嗅"
      ],
      "hemi": "left",
      "label_id": 58
    },
    {
      "id": "L_a24pr_ROI",
      "name": "左前扣带回前部 a24pr",
      "color": "#B08582",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 59
    },
    {
      "id": "L_p32pr_ROI",
      "name": "左后扣带回 32 前部",
      "color": "#A38E79",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 60
    },
    {
      "id": "L_a24_ROI",
      "name": "左前扣带回前部 a24",
      "color": "#430C19",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 61
    },
    {
      "id": "L_d32_ROI",
      "name": "左背侧前扣带 32",
      "color": "#5A2932",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 62
    },
    {
      "id": "L_8BM_ROI",
      "name": "左额叶 8BM 区",
      "color": "#695351",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 63
    },
    {
      "id": "L_p32_ROI",
      "name": "左后扣带回 32",
      "color": "#5F2034",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 64
    },
    {
      "id": "L_10r_ROI",
      "name": "左额极前部 10r",
      "color": "#190C01",
      "lobe": "frontal",
      "aliases": [
        "左前额极",
        "前额极"
      ],
      "hemi": "left",
      "label_id": 65
    },
    {
      "id": "L_47m_ROI",
      "name": "左额下回眶部内侧 47m",
      "color": "#604B42",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "左眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "left",
      "label_id": 66
    },
    {
      "id": "L_8Av_ROI",
      "name": "左额眼区腹侧 8Av",
      "color": "#35362B",
      "lobe": "frontal",
      "aliases": [
        "左额眼区",
        "额眼区"
      ],
      "hemi": "left",
      "label_id": 67
    },
    {
      "id": "L_8Ad_ROI",
      "name": "左额眼区背侧 8Ad",
      "color": "#3F4330",
      "lobe": "frontal",
      "aliases": [
        "左额眼区",
        "额眼区"
      ],
      "hemi": "left",
      "label_id": 68
    },
    {
      "id": "L_9m_ROI",
      "name": "左内侧前额叶 9m",
      "color": "#2B2312",
      "lobe": "frontal",
      "aliases": [
        "左内侧前额叶",
        "内侧前额叶"
      ],
      "hemi": "left",
      "label_id": 69
    },
    {
      "id": "L_8BL_ROI",
      "name": "左额叶 8BL 区",
      "color": "#222714",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 70
    },
    {
      "id": "L_9p_ROI",
      "name": "左前额叶 9p",
      "color": "#262B1C",
      "lobe": "frontal",
      "aliases": [
        "左前额叶",
        "前额叶"
      ],
      "hemi": "left",
      "label_id": 71
    },
    {
      "id": "L_10d_ROI",
      "name": "左背外侧前额叶 10d",
      "color": "#262318",
      "lobe": "frontal",
      "aliases": [
        "左背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "left",
      "label_id": 72
    },
    {
      "id": "L_8C_ROI",
      "name": "左额叶 8C 区",
      "color": "#655554",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 73
    },
    {
      "id": "L_44_ROI",
      "name": "左布洛卡区 44",
      "color": "#58583E",
      "lobe": "frontal",
      "aliases": [
        "左布洛卡",
        "左Broca",
        "左额下回",
        "布洛卡",
        "Broca",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 74
    },
    {
      "id": "L_45_ROI",
      "name": "左布洛卡区 45",
      "color": "#3C3F2A",
      "lobe": "frontal",
      "aliases": [
        "左布洛卡",
        "左Broca",
        "左额下回",
        "布洛卡",
        "Broca",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 75
    },
    {
      "id": "L_47l_ROI",
      "name": "左额下回眶部外侧 47l",
      "color": "#33311F",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "左眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "left",
      "label_id": 76
    },
    {
      "id": "L_a47r_ROI",
      "name": "左额下回前部 a47r",
      "color": "#4D4C42",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 77
    },
    {
      "id": "L_6r_ROI",
      "name": "左外侧前运动区 6r",
      "color": "#B2D697",
      "lobe": "frontal",
      "aliases": [
        "左前运动",
        "前运动"
      ],
      "hemi": "left",
      "label_id": 78
    },
    {
      "id": "L_IFJa_ROI",
      "name": "左额下连接前部 IFJa",
      "color": "#7E775F",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 79
    },
    {
      "id": "L_IFJp_ROI",
      "name": "左额下连接后部 IFJp",
      "color": "#89A084",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 80
    },
    {
      "id": "L_IFSp_ROI",
      "name": "左额下沟后部 IFSp",
      "color": "#616257",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 81
    },
    {
      "id": "L_IFSa_ROI",
      "name": "左额下沟前部 IFSa",
      "color": "#BCC9B2",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 82
    },
    {
      "id": "L_p9-46v_ROI",
      "name": "左背外侧前额叶后部 p9-46v",
      "color": "#8A9586",
      "lobe": "frontal",
      "aliases": [
        "左背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "left",
      "label_id": 83
    },
    {
      "id": "L_46_ROI",
      "name": "左背外侧前额叶 46",
      "color": "#CFD9C8",
      "lobe": "frontal",
      "aliases": [
        "左背外侧前额叶",
        "左DLPFC",
        "背外侧前额叶",
        "DLPFC"
      ],
      "hemi": "left",
      "label_id": 84
    },
    {
      "id": "L_a9-46v_ROI",
      "name": "左背外侧前额叶前部 a9-46v",
      "color": "#917080",
      "lobe": "frontal",
      "aliases": [
        "左背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "left",
      "label_id": 85
    },
    {
      "id": "L_9-46d_ROI",
      "name": "左背外侧前额叶 9-46d",
      "color": "#8C7583",
      "lobe": "frontal",
      "aliases": [
        "左背外侧前额叶",
        "左DLPFC",
        "背外侧前额叶",
        "DLPFC"
      ],
      "hemi": "left",
      "label_id": 86
    },
    {
      "id": "L_9a_ROI",
      "name": "左前额叶 9a",
      "color": "#37342D",
      "lobe": "frontal",
      "aliases": [
        "左前额叶",
        "前额叶"
      ],
      "hemi": "left",
      "label_id": 87
    },
    {
      "id": "L_10v_ROI",
      "name": "左腹内侧前额叶 10v",
      "color": "#0E230E",
      "lobe": "frontal",
      "aliases": [
        "左腹内侧前额叶",
        "左VMPFC",
        "腹内侧前额叶",
        "VMPFC"
      ],
      "hemi": "left",
      "label_id": 88
    },
    {
      "id": "L_a10p_ROI",
      "name": "左额极前部 a10p",
      "color": "#624B59",
      "lobe": "frontal",
      "aliases": [
        "左前额极",
        "前额极"
      ],
      "hemi": "left",
      "label_id": 89
    },
    {
      "id": "L_10pp_ROI",
      "name": "左额极后部 10pp",
      "color": "#373E3A",
      "lobe": "frontal",
      "aliases": [
        "左前额极",
        "前额极"
      ],
      "hemi": "left",
      "label_id": 90
    },
    {
      "id": "L_11l_ROI",
      "name": "左眶额外侧 11l",
      "color": "#816A76",
      "lobe": "frontal",
      "aliases": [
        "左眶额",
        "眶额"
      ],
      "hemi": "left",
      "label_id": 91
    },
    {
      "id": "L_13l_ROI",
      "name": "左岛叶 13l",
      "color": "#523C45",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 92
    },
    {
      "id": "L_OFC_ROI",
      "name": "左眶额皮层 OFC",
      "color": "#28231F",
      "lobe": "frontal",
      "aliases": [
        "左眶额",
        "左OFC",
        "眶额",
        "OFC"
      ],
      "hemi": "left",
      "label_id": 93
    },
    {
      "id": "L_47s_ROI",
      "name": "左额下回眶部 47s",
      "color": "#422321",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "左眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "left",
      "label_id": 94
    },
    {
      "id": "L_LIPd_ROI",
      "name": "左背侧顶内沟外侧",
      "color": "#9BB4CA",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 95
    },
    {
      "id": "L_6a_ROI",
      "name": "左背侧前运动区 6a",
      "color": "#79C088",
      "lobe": "frontal",
      "aliases": [
        "左前运动",
        "前运动"
      ],
      "hemi": "left",
      "label_id": 96
    },
    {
      "id": "L_i6-8_ROI",
      "name": "左额中回后部 i6-8",
      "color": "#5A6253",
      "lobe": "frontal",
      "aliases": [
        "左额中回",
        "额中回"
      ],
      "hemi": "left",
      "label_id": 97
    },
    {
      "id": "L_s6-8_ROI",
      "name": "左额上回后部 s6-8",
      "color": "#585C49",
      "lobe": "frontal",
      "aliases": [
        "左额上回",
        "额上回"
      ],
      "hemi": "left",
      "label_id": 98
    },
    {
      "id": "L_43_ROI",
      "name": "左中央后下回 43",
      "color": "#918A40",
      "lobe": "parietal",
      "aliases": [
        "左中央后回",
        "中央后回"
      ],
      "hemi": "left",
      "label_id": 99
    },
    {
      "id": "L_OP4_ROI",
      "name": "左顶叶岛盖 4",
      "color": "#729D31",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 100
    },
    {
      "id": "L_OP1_ROI",
      "name": "左顶叶岛盖 1",
      "color": "#639E23",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 101
    },
    {
      "id": "L_OP2-3_ROI",
      "name": "左顶叶岛盖 2-3",
      "color": "#917F34",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 102
    },
    {
      "id": "L_52_ROI",
      "name": "左岛叶 52 区",
      "color": "#D04842",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 103
    },
    {
      "id": "L_RI_ROI",
      "name": "左岛盖后部 RI",
      "color": "#B23D17",
      "lobe": "temporal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 104
    },
    {
      "id": "L_PFcm_ROI",
      "name": "左顶下小叶 PFcm",
      "color": "#BE9059",
      "lobe": "parietal",
      "aliases": [
        "左顶下小叶",
        "顶下小叶"
      ],
      "hemi": "left",
      "label_id": 105
    },
    {
      "id": "L_PoI2_ROI",
      "name": "左中央后岛盖 2",
      "color": "#837C53",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 106
    },
    {
      "id": "L_TA2_ROI",
      "name": "左颞叶听觉联合区 TA2",
      "color": "#822A1B",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 107
    },
    {
      "id": "L_FOP4_ROI",
      "name": "左额叶岛盖 4",
      "color": "#B69481",
      "lobe": "frontal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 108
    },
    {
      "id": "L_MI_ROI",
      "name": "左岛叶运动区 MI",
      "color": "#9D746A",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 109
    },
    {
      "id": "L_Pir_ROI",
      "name": "左梨状皮层 Pir",
      "color": "#5A4241",
      "lobe": "temporal",
      "aliases": [
        "左梨状",
        "梨状"
      ],
      "hemi": "left",
      "label_id": 110
    },
    {
      "id": "L_AVI_ROI",
      "name": "左前腹岛叶 AVI",
      "color": "#8D4853",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 111
    },
    {
      "id": "L_AAIC_ROI",
      "name": "左前岛叶前部 AAIC",
      "color": "#55232C",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 112
    },
    {
      "id": "L_FOP1_ROI",
      "name": "左额叶岛盖 1",
      "color": "#A09958",
      "lobe": "frontal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 113
    },
    {
      "id": "L_FOP3_ROI",
      "name": "左额叶岛盖 3",
      "color": "#AF8963",
      "lobe": "frontal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 114
    },
    {
      "id": "L_FOP2_ROI",
      "name": "左额叶岛盖 2",
      "color": "#639C33",
      "lobe": "frontal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 115
    },
    {
      "id": "L_PFt_ROI",
      "name": "左顶下小叶 PFt",
      "color": "#81DE86",
      "lobe": "parietal",
      "aliases": [
        "左顶下小叶",
        "顶下小叶"
      ],
      "hemi": "left",
      "label_id": 116
    },
    {
      "id": "L_AIP_ROI",
      "name": "左前顶内沟 AIP",
      "color": "#88DCA6",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 117
    },
    {
      "id": "L_EC_ROI",
      "name": "左嗅周皮层 EC",
      "color": "#313023",
      "lobe": "temporal",
      "aliases": [
        "左嗅周",
        "嗅周"
      ],
      "hemi": "left",
      "label_id": 118
    },
    {
      "id": "L_PreS_ROI",
      "name": "左旁海马回前部 PreS",
      "color": "#563953",
      "lobe": "temporal",
      "aliases": [
        "左旁海马",
        "旁海马"
      ],
      "hemi": "left",
      "label_id": 119
    },
    {
      "id": "L_H_ROI",
      "name": "左海马 H",
      "color": "#3C3928",
      "lobe": "temporal",
      "aliases": [
        "左海马",
        "海马"
      ],
      "hemi": "left",
      "label_id": 120
    },
    {
      "id": "L_ProS_ROI",
      "name": "左海马旁回后部 ProS",
      "color": "#573BB0",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 121
    },
    {
      "id": "L_PeEc_ROI",
      "name": "左嗅周皮层后部 PeEc",
      "color": "#3D3E33",
      "lobe": "temporal",
      "aliases": [
        "左嗅周",
        "嗅周"
      ],
      "hemi": "left",
      "label_id": 122
    },
    {
      "id": "L_STGa_ROI",
      "name": "左颞上回前部 STGa",
      "color": "#3A2A1A",
      "lobe": "temporal",
      "aliases": [
        "左颞上回",
        "颞上回"
      ],
      "hemi": "left",
      "label_id": 123
    },
    {
      "id": "L_PBelt_ROI",
      "name": "左后听觉带 PBelt",
      "color": "#C31E05",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 124
    },
    {
      "id": "L_A5_ROI",
      "name": "左听觉联合区 A5",
      "color": "#632706",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 125
    },
    {
      "id": "L_PHA1_ROI",
      "name": "左海马旁回 1",
      "color": "#45324B",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 126
    },
    {
      "id": "L_PHA3_ROI",
      "name": "左海马旁回 3",
      "color": "#606671",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 127
    },
    {
      "id": "L_STSda_ROI",
      "name": "左颞上沟背前 STSda",
      "color": "#4D3322",
      "lobe": "temporal",
      "aliases": [
        "左颞上沟",
        "颞上沟"
      ],
      "hemi": "left",
      "label_id": 128
    },
    {
      "id": "L_STSdp_ROI",
      "name": "左颞上沟背后 STSdp",
      "color": "#493927",
      "lobe": "temporal",
      "aliases": [
        "左颞上沟",
        "颞上沟"
      ],
      "hemi": "left",
      "label_id": 129
    },
    {
      "id": "L_STSvp_ROI",
      "name": "左颞上沟腹后 STSvp",
      "color": "#473B39",
      "lobe": "temporal",
      "aliases": [
        "左颞上沟",
        "颞上沟"
      ],
      "hemi": "left",
      "label_id": 130
    },
    {
      "id": "L_TGd_ROI",
      "name": "左颞极背侧 TGd",
      "color": "#232217",
      "lobe": "temporal",
      "aliases": [
        "左颞极",
        "颞极"
      ],
      "hemi": "left",
      "label_id": 131
    },
    {
      "id": "L_TE1a_ROI",
      "name": "左颞下回前部 TE1a",
      "color": "#0B0E00",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 132
    },
    {
      "id": "L_TE1p_ROI",
      "name": "左颞下回后部 TE1p",
      "color": "#60665E",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 133
    },
    {
      "id": "L_TE2a_ROI",
      "name": "左颞下回前部 TE2a",
      "color": "#43403A",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 134
    },
    {
      "id": "L_TF_ROI",
      "name": "左颞下回后部 TF",
      "color": "#404838",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 135
    },
    {
      "id": "L_TE2p_ROI",
      "name": "左颞下回后部 TE2p",
      "color": "#698075",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 136
    },
    {
      "id": "L_PHT_ROI",
      "name": "左颞叶海马旁回 PHT",
      "color": "#D9FCDF",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 137
    },
    {
      "id": "L_PH_ROI",
      "name": "左海马旁回 PH",
      "color": "#5883A3",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 138
    },
    {
      "id": "L_TPOJ1_ROI",
      "name": "左颞顶枕交界 1",
      "color": "#7D5A40",
      "lobe": "parietal",
      "aliases": [
        "左颞顶枕",
        "颞顶枕"
      ],
      "hemi": "left",
      "label_id": 139
    },
    {
      "id": "L_TPOJ2_ROI",
      "name": "左颞顶枕交界 2",
      "color": "#9CA28A",
      "lobe": "parietal",
      "aliases": [
        "左颞顶枕",
        "颞顶枕"
      ],
      "hemi": "left",
      "label_id": 140
    },
    {
      "id": "L_TPOJ3_ROI",
      "name": "左颞顶枕交界 3",
      "color": "#799491",
      "lobe": "parietal",
      "aliases": [
        "左颞顶枕",
        "颞顶枕"
      ],
      "hemi": "left",
      "label_id": 141
    },
    {
      "id": "L_DVT_ROI",
      "name": "左背侧视觉通路颞顶区",
      "color": "#7870BE",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 142
    },
    {
      "id": "L_PGp_ROI",
      "name": "左角回 PGp",
      "color": "#9BBEE4",
      "lobe": "parietal",
      "aliases": [
        "左角回",
        "角回"
      ],
      "hemi": "left",
      "label_id": 143
    },
    {
      "id": "L_IP2_ROI",
      "name": "左顶内沟 2",
      "color": "#B0A6AE",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 144
    },
    {
      "id": "L_IP1_ROI",
      "name": "左顶内沟 1",
      "color": "#767980",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 145
    },
    {
      "id": "L_IP0_ROI",
      "name": "左顶内沟 0",
      "color": "#70A0CF",
      "lobe": "parietal",
      "aliases": [
        "左顶内沟",
        "顶内沟"
      ],
      "hemi": "left",
      "label_id": 146
    },
    {
      "id": "L_PFop_ROI",
      "name": "左顶盖区 PFop",
      "color": "#BBCD91",
      "lobe": "parietal",
      "aliases": [
        "左顶盖",
        "顶盖"
      ],
      "hemi": "left",
      "label_id": 147
    },
    {
      "id": "L_PF_ROI",
      "name": "左顶下小叶 PF",
      "color": "#FFFFE2",
      "lobe": "parietal",
      "aliases": [
        "左顶下小叶",
        "顶下小叶"
      ],
      "hemi": "left",
      "label_id": 148
    },
    {
      "id": "L_PFm_ROI",
      "name": "左顶下小叶 PFm",
      "color": "#856972",
      "lobe": "parietal",
      "aliases": [
        "左顶下小叶",
        "顶下小叶"
      ],
      "hemi": "left",
      "label_id": 149
    },
    {
      "id": "L_PGi_ROI",
      "name": "左顶下小叶 PGi",
      "color": "#353E2E",
      "lobe": "parietal",
      "aliases": [
        "左顶下小叶",
        "顶下小叶"
      ],
      "hemi": "left",
      "label_id": 150
    },
    {
      "id": "L_PGs_ROI",
      "name": "左缘上回 PGs",
      "color": "#3E4339",
      "lobe": "parietal",
      "aliases": [
        "左缘上回",
        "缘上回"
      ],
      "hemi": "left",
      "label_id": 151
    },
    {
      "id": "L_V6A_ROI",
      "name": "左第六视皮层 A V6A",
      "color": "#2959A6",
      "lobe": "occipital",
      "aliases": [
        "左V6A",
        "V6A"
      ],
      "hemi": "left",
      "label_id": 152
    },
    {
      "id": "L_VMV1_ROI",
      "name": "左腹内侧视觉区 VMV1",
      "color": "#3E3D9B",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 153
    },
    {
      "id": "L_VMV3_ROI",
      "name": "左腹内侧视觉区 VMV3",
      "color": "#31359F",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 154
    },
    {
      "id": "L_PHA2_ROI",
      "name": "左海马旁回 2",
      "color": "#585A59",
      "lobe": "temporal",
      "aliases": [
        "左海马旁回",
        "海马旁回"
      ],
      "hemi": "left",
      "label_id": 155
    },
    {
      "id": "L_V4t_ROI",
      "name": "左颞区 V4t",
      "color": "#0E4F80",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 156
    },
    {
      "id": "L_FST_ROI",
      "name": "左颞上沟底部 FST",
      "color": "#5C9D99",
      "lobe": "temporal",
      "aliases": [
        "左颞上沟",
        "颞上沟"
      ],
      "hemi": "left",
      "label_id": 157
    },
    {
      "id": "L_V3CD_ROI",
      "name": "左第三视皮层 CD V3CD",
      "color": "#0F2EB6",
      "lobe": "occipital",
      "aliases": [
        "左V3CD",
        "V3CD"
      ],
      "hemi": "left",
      "label_id": 158
    },
    {
      "id": "L_LO3_ROI",
      "name": "左外侧枕叶 3",
      "color": "#365EA0",
      "lobe": "occipital",
      "aliases": [
        "左外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "left",
      "label_id": 159
    },
    {
      "id": "L_VMV2_ROI",
      "name": "左腹内侧视觉区 VMV2",
      "color": "#433EA1",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 160
    },
    {
      "id": "L_31pd_ROI",
      "name": "左后扣带回 31pd",
      "color": "#38162D",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 161
    },
    {
      "id": "L_31a_ROI",
      "name": "左后扣带回 31a",
      "color": "#8F6985",
      "lobe": "cingulate",
      "aliases": [
        "左后扣带",
        "后扣带"
      ],
      "hemi": "left",
      "label_id": 162
    },
    {
      "id": "L_VVC_ROI",
      "name": "左腹侧视觉皮层 VVC",
      "color": "#353D7C",
      "lobe": "occipital",
      "aliases": [
        "左腹侧视觉",
        "腹侧视觉"
      ],
      "hemi": "left",
      "label_id": 163
    },
    {
      "id": "L_25_ROI",
      "name": "左膝下前扣带 25",
      "color": "#24180E",
      "lobe": "cingulate",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 164
    },
    {
      "id": "L_s32_ROI",
      "name": "左辅助运动区前部",
      "color": "#2E2315",
      "lobe": "frontal",
      "aliases": [
        "左辅助运动",
        "辅助运动"
      ],
      "hemi": "left",
      "label_id": 165
    },
    {
      "id": "L_pOFC_ROI",
      "name": "左眶额后部 pOFC",
      "color": "#4C3035",
      "lobe": "frontal",
      "aliases": [
        "左眶额",
        "眶额"
      ],
      "hemi": "left",
      "label_id": 166
    },
    {
      "id": "L_PoI1_ROI",
      "name": "左中央后岛盖 1",
      "color": "#A46861",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 167
    },
    {
      "id": "L_Ig_ROI",
      "name": "左颗粒岛叶 Ig",
      "color": "#6E7B24",
      "lobe": "insula",
      "aliases": [
        "左岛叶",
        "岛叶"
      ],
      "hemi": "left",
      "label_id": 168
    },
    {
      "id": "L_FOP5_ROI",
      "name": "左额叶岛盖 5",
      "color": "#A36669",
      "lobe": "frontal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 169
    },
    {
      "id": "L_p10p_ROI",
      "name": "左额极后部 p10p",
      "color": "#59404C",
      "lobe": "frontal",
      "aliases": [
        "左前额极",
        "前额极"
      ],
      "hemi": "left",
      "label_id": 170
    },
    {
      "id": "L_p47r_ROI",
      "name": "左额下回后部 p47r",
      "color": "#7E7B70",
      "lobe": "frontal",
      "aliases": [
        "左额下回",
        "额下回"
      ],
      "hemi": "left",
      "label_id": 171
    },
    {
      "id": "L_TGv_ROI",
      "name": "左颞极腹侧 TGv",
      "color": "#2E332A",
      "lobe": "temporal",
      "aliases": [
        "左颞极",
        "颞极"
      ],
      "hemi": "left",
      "label_id": 172
    },
    {
      "id": "L_MBelt_ROI",
      "name": "左内侧听觉带 MBelt",
      "color": "#BB1E18",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 173
    },
    {
      "id": "L_LBelt_ROI",
      "name": "左外侧听觉带 LBelt",
      "color": "#E9121B",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 174
    },
    {
      "id": "L_A4_ROI",
      "name": "左听觉联合区 A4",
      "color": "#982704",
      "lobe": "temporal",
      "aliases": [
        "左听觉",
        "听觉"
      ],
      "hemi": "left",
      "label_id": 175
    },
    {
      "id": "L_STSva_ROI",
      "name": "左颞上沟腹前 STSva",
      "color": "#282116",
      "lobe": "temporal",
      "aliases": [
        "左颞上沟",
        "颞上沟"
      ],
      "hemi": "left",
      "label_id": 176
    },
    {
      "id": "L_TE1m_ROI",
      "name": "左颞下回中部 TE1m",
      "color": "#3B2D2B",
      "lobe": "temporal",
      "aliases": [
        "左颞下回",
        "颞下回"
      ],
      "hemi": "left",
      "label_id": 177
    },
    {
      "id": "L_PI_ROI",
      "name": "左顶叶岛盖后部 PI",
      "color": "#7A3232",
      "lobe": "parietal",
      "aliases": [
        "左岛盖",
        "岛盖"
      ],
      "hemi": "left",
      "label_id": 178
    },
    {
      "id": "L_a32pr_ROI",
      "name": "左前扣带 32 前部",
      "color": "#823F57",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 179
    },
    {
      "id": "L_p24_ROI",
      "name": "左后扣带回前部 p24",
      "color": "#7B234A",
      "lobe": "frontal",
      "aliases": [
        "左前扣带",
        "前扣带"
      ],
      "hemi": "left",
      "label_id": 180
    },
    {
      "id": "R_V1_ROI",
      "name": "右初级视皮层 V1",
      "color": "#3E00FF",
      "lobe": "occipital",
      "aliases": [
        "右初级视皮层",
        "右V1",
        "初级视皮层",
        "V1"
      ],
      "hemi": "right",
      "label_id": 1
    },
    {
      "id": "R_MST_ROI",
      "name": "右内侧上颞区 MST",
      "color": "#327080",
      "lobe": "temporal",
      "aliases": [
        "右上颞",
        "上颞"
      ],
      "hemi": "right",
      "label_id": 2
    },
    {
      "id": "R_V6_ROI",
      "name": "右第六视皮层 V6",
      "color": "#435AB4",
      "lobe": "occipital",
      "aliases": [
        "右V6",
        "V6"
      ],
      "hemi": "right",
      "label_id": 3
    },
    {
      "id": "R_V2_ROI",
      "name": "右次级视皮层 V2",
      "color": "#1B38EA",
      "lobe": "occipital",
      "aliases": [
        "右V2",
        "V2"
      ],
      "hemi": "right",
      "label_id": 4
    },
    {
      "id": "R_V3_ROI",
      "name": "右第三视皮层 V3",
      "color": "#132CE8",
      "lobe": "occipital",
      "aliases": [
        "右V3",
        "V3"
      ],
      "hemi": "right",
      "label_id": 5
    },
    {
      "id": "R_V4_ROI",
      "name": "右第四视皮层 V4",
      "color": "#112FDC",
      "lobe": "occipital",
      "aliases": [
        "右V4",
        "V4"
      ],
      "hemi": "right",
      "label_id": 6
    },
    {
      "id": "R_V8_ROI",
      "name": "右第八视皮层 V8",
      "color": "#1744D2",
      "lobe": "occipital",
      "aliases": [
        "右V8",
        "V8"
      ],
      "hemi": "right",
      "label_id": 7
    },
    {
      "id": "R_4_ROI",
      "name": "右中央前回 4",
      "color": "#1FBA1A",
      "lobe": "frontal",
      "aliases": [
        "右中央前回",
        "右运动皮层",
        "右初级运动",
        "中央前回",
        "运动皮层",
        "初级运动"
      ],
      "hemi": "right",
      "label_id": 8
    },
    {
      "id": "R_3b_ROI",
      "name": "右中央后回 3b 区",
      "color": "#28C518",
      "lobe": "parietal",
      "aliases": [
        "右中央后回",
        "右体感",
        "中央后回",
        "体感"
      ],
      "hemi": "right",
      "label_id": 9
    },
    {
      "id": "R_FEF_ROI",
      "name": "右额眼区",
      "color": "#899B96",
      "lobe": "frontal",
      "aliases": [
        "右额眼区",
        "右FEF",
        "额眼区",
        "FEF"
      ],
      "hemi": "right",
      "label_id": 10
    },
    {
      "id": "R_PEF_ROI",
      "name": "右后眼区 PEF",
      "color": "#9DB6A7",
      "lobe": "frontal",
      "aliases": [
        "右眼区",
        "眼区"
      ],
      "hemi": "right",
      "label_id": 11
    },
    {
      "id": "R_55b_ROI",
      "name": "右岛叶 55b 区",
      "color": "#696B4A",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 12
    },
    {
      "id": "R_V3A_ROI",
      "name": "右第三视皮层 A V3A",
      "color": "#1348F7",
      "lobe": "occipital",
      "aliases": [
        "右V3A",
        "V3A"
      ],
      "hemi": "right",
      "label_id": 13
    },
    {
      "id": "R_RSC_ROI",
      "name": "右压后皮层 RSC",
      "color": "#954588",
      "lobe": "parietal",
      "aliases": [
        "右压后",
        "压后"
      ],
      "hemi": "right",
      "label_id": 14
    },
    {
      "id": "R_POS2_ROI",
      "name": "右顶枕沟 2",
      "color": "#CD6FCD",
      "lobe": "parietal",
      "aliases": [
        "右顶枕沟",
        "顶枕沟"
      ],
      "hemi": "right",
      "label_id": 15
    },
    {
      "id": "R_V7_ROI",
      "name": "右第七视皮层 V7",
      "color": "#1C60C0",
      "lobe": "occipital",
      "aliases": [
        "右V7",
        "V7"
      ],
      "hemi": "right",
      "label_id": 16
    },
    {
      "id": "R_IPS1_ROI",
      "name": "右顶内沟 IPS1",
      "color": "#3F8DAF",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 17
    },
    {
      "id": "R_FFC_ROI",
      "name": "右梭状回面部区 FFC",
      "color": "#346C7A",
      "lobe": "temporal",
      "aliases": [
        "右梭状回",
        "右面部",
        "梭状回",
        "面部"
      ],
      "hemi": "right",
      "label_id": 18
    },
    {
      "id": "R_V3B_ROI",
      "name": "右第三视皮层 B V3B",
      "color": "#2850DE",
      "lobe": "occipital",
      "aliases": [
        "右V3B",
        "V3B"
      ],
      "hemi": "right",
      "label_id": 19
    },
    {
      "id": "R_LO1_ROI",
      "name": "右外侧枕叶 1",
      "color": "#0D43C8",
      "lobe": "occipital",
      "aliases": [
        "右外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "right",
      "label_id": 20
    },
    {
      "id": "R_LO2_ROI",
      "name": "右外侧枕叶 2",
      "color": "#1342B6",
      "lobe": "occipital",
      "aliases": [
        "右外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "right",
      "label_id": 21
    },
    {
      "id": "R_PIT_ROI",
      "name": "右颞下后部视觉区 PIT",
      "color": "#254AB8",
      "lobe": "temporal",
      "aliases": [
        "右颞下",
        "颞下"
      ],
      "hemi": "right",
      "label_id": 22
    },
    {
      "id": "R_MT_ROI",
      "name": "右中颞区 MT",
      "color": "#1F636C",
      "lobe": "temporal",
      "aliases": [
        "右中颞",
        "右MT",
        "右V5",
        "中颞",
        "MT",
        "V5"
      ],
      "hemi": "right",
      "label_id": 23
    },
    {
      "id": "R_A1_ROI",
      "name": "右初级听皮层 A1",
      "color": "#E80A2E",
      "lobe": "temporal",
      "aliases": [
        "右初级听皮层",
        "右A1",
        "初级听皮层",
        "A1"
      ],
      "hemi": "right",
      "label_id": 24
    },
    {
      "id": "R_PSL_ROI",
      "name": "右上顶小叶外侧 PSL",
      "color": "#BD9488",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 25
    },
    {
      "id": "R_SFL_ROI",
      "name": "右额岛盖沟 SFL",
      "color": "#423C2F",
      "lobe": "temporal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 26
    },
    {
      "id": "R_PCV_ROI",
      "name": "右压后皮层 PCV",
      "color": "#82929D",
      "lobe": "parietal",
      "aliases": [
        "右压后",
        "压后"
      ],
      "hemi": "right",
      "label_id": 27
    },
    {
      "id": "R_STV_ROI",
      "name": "右颞上视觉区 STV",
      "color": "#8B736A",
      "lobe": "temporal",
      "aliases": [
        "右颞上",
        "颞上"
      ],
      "hemi": "right",
      "label_id": 28
    },
    {
      "id": "R_7Pm_ROI",
      "name": "右顶上小叶后内侧 7Pm",
      "color": "#99D5C5",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 29
    },
    {
      "id": "R_7m_ROI",
      "name": "右顶上小叶内侧 7m",
      "color": "#2F3035",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 30
    },
    {
      "id": "R_POS1_ROI",
      "name": "右顶枕沟 1",
      "color": "#535376",
      "lobe": "parietal",
      "aliases": [
        "右顶枕沟",
        "顶枕沟"
      ],
      "hemi": "right",
      "label_id": 31
    },
    {
      "id": "R_23d_ROI",
      "name": "右后扣带回 23d",
      "color": "#873862",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 32
    },
    {
      "id": "R_v23ab_ROI",
      "name": "右腹侧后扣带 v23ab",
      "color": "#1A0B19",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 33
    },
    {
      "id": "R_d23ab_ROI",
      "name": "右背侧后扣带 d23ab",
      "color": "#3C102C",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 34
    },
    {
      "id": "R_31pv_ROI",
      "name": "右后扣带回 31pv",
      "color": "#441132",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 35
    },
    {
      "id": "R_5m_ROI",
      "name": "右旁中央小叶后部 5m",
      "color": "#2BB131",
      "lobe": "frontal",
      "aliases": [
        "右旁中央小叶",
        "旁中央小叶"
      ],
      "hemi": "right",
      "label_id": 36
    },
    {
      "id": "R_5mv_ROI",
      "name": "右旁中央小叶后部 5mv",
      "color": "#8BA581",
      "lobe": "frontal",
      "aliases": [
        "右旁中央小叶",
        "旁中央小叶"
      ],
      "hemi": "right",
      "label_id": 37
    },
    {
      "id": "R_23c_ROI",
      "name": "右后扣带回 23c",
      "color": "#CDC5C3",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 38
    },
    {
      "id": "R_5L_ROI",
      "name": "右顶上小叶前外侧 5L",
      "color": "#40A343",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 39
    },
    {
      "id": "R_24dd_ROI",
      "name": "右背侧前扣带回 24dd",
      "color": "#45A730",
      "lobe": "cingulate",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 40
    },
    {
      "id": "R_24dv_ROI",
      "name": "右腹侧前扣带回 24dv",
      "color": "#70A142",
      "lobe": "cingulate",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 41
    },
    {
      "id": "R_7AL_ROI",
      "name": "右顶上小叶前外侧 7AL",
      "color": "#71BB7A",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 42
    },
    {
      "id": "R_SCEF_ROI",
      "name": "右辅助眼区",
      "color": "#8D996F",
      "lobe": "frontal",
      "aliases": [
        "右眼区",
        "眼区"
      ],
      "hemi": "right",
      "label_id": 43
    },
    {
      "id": "R_6ma_ROI",
      "name": "右辅助运动区 6ma",
      "color": "#96B08B",
      "lobe": "frontal",
      "aliases": [
        "右辅助运动",
        "右SMA",
        "辅助运动",
        "SMA"
      ],
      "hemi": "right",
      "label_id": 44
    },
    {
      "id": "R_7Am_ROI",
      "name": "右顶上小叶前内侧 7Am",
      "color": "#A9F9D8",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 45
    },
    {
      "id": "R_7PL_ROI",
      "name": "右顶上小叶后外侧 7PL",
      "color": "#9AFDE3",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 46
    },
    {
      "id": "R_7PC_ROI",
      "name": "右顶上小叶中央 7PC",
      "color": "#47B66A",
      "lobe": "parietal",
      "aliases": [
        "右顶上小叶",
        "顶上小叶"
      ],
      "hemi": "right",
      "label_id": 47
    },
    {
      "id": "R_LIPv_ROI",
      "name": "右腹侧顶内沟外侧",
      "color": "#3D81AB",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 48
    },
    {
      "id": "R_VIP_ROI",
      "name": "右腹顶内沟 VIP",
      "color": "#368993",
      "lobe": "occipital",
      "aliases": [
        "右腹顶内沟",
        "腹顶内沟"
      ],
      "hemi": "right",
      "label_id": 49
    },
    {
      "id": "R_MIP_ROI",
      "name": "右内侧顶内沟 MIP",
      "color": "#7ED2C5",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 50
    },
    {
      "id": "R_1_ROI",
      "name": "右中央后回 1 区",
      "color": "#1CC72C",
      "lobe": "parietal",
      "aliases": [
        "右中央后回",
        "右体感",
        "中央后回",
        "体感"
      ],
      "hemi": "right",
      "label_id": 51
    },
    {
      "id": "R_2_ROI",
      "name": "右中央后回 2 区",
      "color": "#33B945",
      "lobe": "parietal",
      "aliases": [
        "右中央后回",
        "右体感",
        "中央后回",
        "体感"
      ],
      "hemi": "right",
      "label_id": 52
    },
    {
      "id": "R_3a_ROI",
      "name": "右中央后回 3a 区",
      "color": "#2CE11D",
      "lobe": "parietal",
      "aliases": [
        "右中央后回",
        "右体感",
        "中央后回",
        "体感"
      ],
      "hemi": "right",
      "label_id": 53
    },
    {
      "id": "R_6d_ROI",
      "name": "右背外侧前运动区 6d",
      "color": "#1FA529",
      "lobe": "frontal",
      "aliases": [
        "右前运动",
        "前运动"
      ],
      "hemi": "right",
      "label_id": 54
    },
    {
      "id": "R_6mp_ROI",
      "name": "右辅助运动区内侧 6mp",
      "color": "#43A32F",
      "lobe": "frontal",
      "aliases": [
        "右辅助运动",
        "右SMA",
        "辅助运动",
        "SMA"
      ],
      "hemi": "right",
      "label_id": 55
    },
    {
      "id": "R_6v_ROI",
      "name": "右腹侧前运动区 6v",
      "color": "#59B942",
      "lobe": "frontal",
      "aliases": [
        "右前运动",
        "前运动"
      ],
      "hemi": "right",
      "label_id": 56
    },
    {
      "id": "R_p24pr_ROI",
      "name": "右后扣带回前部 p24pr",
      "color": "#989478",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 57
    },
    {
      "id": "R_33pr_ROI",
      "name": "右旁嗅皮层 33pr",
      "color": "#756061",
      "lobe": "cingulate",
      "aliases": [
        "右旁嗅",
        "旁嗅"
      ],
      "hemi": "right",
      "label_id": 58
    },
    {
      "id": "R_a24pr_ROI",
      "name": "右前扣带回前部 a24pr",
      "color": "#B08684",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 59
    },
    {
      "id": "R_p32pr_ROI",
      "name": "右后扣带回 32 前部",
      "color": "#B09586",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 60
    },
    {
      "id": "R_a24_ROI",
      "name": "右前扣带回前部 a24",
      "color": "#491226",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 61
    },
    {
      "id": "R_d32_ROI",
      "name": "右背侧前扣带 32",
      "color": "#6D2E41",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 62
    },
    {
      "id": "R_8BM_ROI",
      "name": "右额叶 8BM 区",
      "color": "#82525C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 63
    },
    {
      "id": "R_p32_ROI",
      "name": "右后扣带回 32",
      "color": "#703750",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 64
    },
    {
      "id": "R_10r_ROI",
      "name": "右额极前部 10r",
      "color": "#1A0408",
      "lobe": "frontal",
      "aliases": [
        "右前额极",
        "前额极"
      ],
      "hemi": "right",
      "label_id": 65
    },
    {
      "id": "R_47m_ROI",
      "name": "右额下回眶部内侧 47m",
      "color": "#4F3432",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "右眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "right",
      "label_id": 66
    },
    {
      "id": "R_8Av_ROI",
      "name": "右额眼区腹侧 8Av",
      "color": "#4F4441",
      "lobe": "frontal",
      "aliases": [
        "右额眼区",
        "额眼区"
      ],
      "hemi": "right",
      "label_id": 67
    },
    {
      "id": "R_8Ad_ROI",
      "name": "右额眼区背侧 8Ad",
      "color": "#373E2C",
      "lobe": "frontal",
      "aliases": [
        "右额眼区",
        "额眼区"
      ],
      "hemi": "right",
      "label_id": 68
    },
    {
      "id": "R_9m_ROI",
      "name": "右内侧前额叶 9m",
      "color": "#2B1913",
      "lobe": "frontal",
      "aliases": [
        "右内侧前额叶",
        "内侧前额叶"
      ],
      "hemi": "right",
      "label_id": 69
    },
    {
      "id": "R_8BL_ROI",
      "name": "右额叶 8BL 区",
      "color": "#232416",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 70
    },
    {
      "id": "R_9p_ROI",
      "name": "右前额叶 9p",
      "color": "#3E3531",
      "lobe": "frontal",
      "aliases": [
        "右前额叶",
        "前额叶"
      ],
      "hemi": "right",
      "label_id": 71
    },
    {
      "id": "R_10d_ROI",
      "name": "右背外侧前额叶 10d",
      "color": "#1C1712",
      "lobe": "frontal",
      "aliases": [
        "右背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "right",
      "label_id": 72
    },
    {
      "id": "R_8C_ROI",
      "name": "右额叶 8C 区",
      "color": "#77595E",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 73
    },
    {
      "id": "R_44_ROI",
      "name": "右布洛卡区 44",
      "color": "#89665E",
      "lobe": "frontal",
      "aliases": [
        "右布洛卡",
        "右Broca",
        "右额下回",
        "布洛卡",
        "Broca",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 74
    },
    {
      "id": "R_45_ROI",
      "name": "右布洛卡区 45",
      "color": "#5B4239",
      "lobe": "frontal",
      "aliases": [
        "右布洛卡",
        "右Broca",
        "右额下回",
        "布洛卡",
        "Broca",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 75
    },
    {
      "id": "R_47l_ROI",
      "name": "右额下回眶部外侧 47l",
      "color": "#331A1B",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "右眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "right",
      "label_id": 76
    },
    {
      "id": "R_a47r_ROI",
      "name": "右额下回前部 a47r",
      "color": "#524645",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 77
    },
    {
      "id": "R_6r_ROI",
      "name": "右外侧前运动区 6r",
      "color": "#BFD7A3",
      "lobe": "frontal",
      "aliases": [
        "右前运动",
        "前运动"
      ],
      "hemi": "right",
      "label_id": 78
    },
    {
      "id": "R_IFJa_ROI",
      "name": "右额下连接前部 IFJa",
      "color": "#8A7B68",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 79
    },
    {
      "id": "R_IFJp_ROI",
      "name": "右额下连接后部 IFJp",
      "color": "#829C88",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 80
    },
    {
      "id": "R_IFSp_ROI",
      "name": "右额下沟后部 IFSp",
      "color": "#7C706F",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 81
    },
    {
      "id": "R_IFSa_ROI",
      "name": "右额下沟前部 IFSa",
      "color": "#D4D6C4",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 82
    },
    {
      "id": "R_p9-46v_ROI",
      "name": "右背外侧前额叶后部 p9-46v",
      "color": "#958F89",
      "lobe": "frontal",
      "aliases": [
        "右背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "right",
      "label_id": 83
    },
    {
      "id": "R_46_ROI",
      "name": "右背外侧前额叶 46",
      "color": "#C1D5BF",
      "lobe": "frontal",
      "aliases": [
        "右背外侧前额叶",
        "右DLPFC",
        "背外侧前额叶",
        "DLPFC"
      ],
      "hemi": "right",
      "label_id": 84
    },
    {
      "id": "R_a9-46v_ROI",
      "name": "右背外侧前额叶前部 a9-46v",
      "color": "#B1869B",
      "lobe": "frontal",
      "aliases": [
        "右背外侧前额叶",
        "背外侧前额叶"
      ],
      "hemi": "right",
      "label_id": 85
    },
    {
      "id": "R_9-46d_ROI",
      "name": "右背外侧前额叶 9-46d",
      "color": "#A08797",
      "lobe": "frontal",
      "aliases": [
        "右背外侧前额叶",
        "右DLPFC",
        "背外侧前额叶",
        "DLPFC"
      ],
      "hemi": "right",
      "label_id": 86
    },
    {
      "id": "R_9a_ROI",
      "name": "右前额叶 9a",
      "color": "#403737",
      "lobe": "frontal",
      "aliases": [
        "右前额叶",
        "前额叶"
      ],
      "hemi": "right",
      "label_id": 87
    },
    {
      "id": "R_10v_ROI",
      "name": "右腹内侧前额叶 10v",
      "color": "#001204",
      "lobe": "frontal",
      "aliases": [
        "右腹内侧前额叶",
        "右VMPFC",
        "腹内侧前额叶",
        "VMPFC"
      ],
      "hemi": "right",
      "label_id": 88
    },
    {
      "id": "R_a10p_ROI",
      "name": "右额极前部 a10p",
      "color": "#685B70",
      "lobe": "frontal",
      "aliases": [
        "右前额极",
        "前额极"
      ],
      "hemi": "right",
      "label_id": 89
    },
    {
      "id": "R_10pp_ROI",
      "name": "右额极后部 10pp",
      "color": "#2A3133",
      "lobe": "frontal",
      "aliases": [
        "右前额极",
        "前额极"
      ],
      "hemi": "right",
      "label_id": 90
    },
    {
      "id": "R_11l_ROI",
      "name": "右眶额外侧 11l",
      "color": "#6A626C",
      "lobe": "frontal",
      "aliases": [
        "右眶额",
        "眶额"
      ],
      "hemi": "right",
      "label_id": 91
    },
    {
      "id": "R_13l_ROI",
      "name": "右岛叶 13l",
      "color": "#5F5558",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 92
    },
    {
      "id": "R_OFC_ROI",
      "name": "右眶额皮层 OFC",
      "color": "#292624",
      "lobe": "frontal",
      "aliases": [
        "右眶额",
        "右OFC",
        "眶额",
        "OFC"
      ],
      "hemi": "right",
      "label_id": 93
    },
    {
      "id": "R_47s_ROI",
      "name": "右额下回眶部 47s",
      "color": "#412526",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "右眶额",
        "额下回",
        "眶额"
      ],
      "hemi": "right",
      "label_id": 94
    },
    {
      "id": "R_LIPd_ROI",
      "name": "右背侧顶内沟外侧",
      "color": "#91BBC7",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 95
    },
    {
      "id": "R_6a_ROI",
      "name": "右背侧前运动区 6a",
      "color": "#77C88F",
      "lobe": "frontal",
      "aliases": [
        "右前运动",
        "前运动"
      ],
      "hemi": "right",
      "label_id": 96
    },
    {
      "id": "R_i6-8_ROI",
      "name": "右额中回后部 i6-8",
      "color": "#6B7A6B",
      "lobe": "frontal",
      "aliases": [
        "右额中回",
        "额中回"
      ],
      "hemi": "right",
      "label_id": 97
    },
    {
      "id": "R_s6-8_ROI",
      "name": "右额上回后部 s6-8",
      "color": "#635D53",
      "lobe": "frontal",
      "aliases": [
        "右额上回",
        "额上回"
      ],
      "hemi": "right",
      "label_id": 98
    },
    {
      "id": "R_43_ROI",
      "name": "右中央后下回 43",
      "color": "#A08D45",
      "lobe": "parietal",
      "aliases": [
        "右中央后回",
        "中央后回"
      ],
      "hemi": "right",
      "label_id": 99
    },
    {
      "id": "R_OP4_ROI",
      "name": "右顶叶岛盖 4",
      "color": "#77A331",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 100
    },
    {
      "id": "R_OP1_ROI",
      "name": "右顶叶岛盖 1",
      "color": "#5E9A24",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 101
    },
    {
      "id": "R_OP2-3_ROI",
      "name": "右顶叶岛盖 2-3",
      "color": "#898235",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 102
    },
    {
      "id": "R_52_ROI",
      "name": "右岛叶 52 区",
      "color": "#C6453D",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 103
    },
    {
      "id": "R_RI_ROI",
      "name": "右岛盖后部 RI",
      "color": "#A7562C",
      "lobe": "temporal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 104
    },
    {
      "id": "R_PFcm_ROI",
      "name": "右顶下小叶 PFcm",
      "color": "#B5995A",
      "lobe": "parietal",
      "aliases": [
        "右顶下小叶",
        "顶下小叶"
      ],
      "hemi": "right",
      "label_id": 105
    },
    {
      "id": "R_PoI2_ROI",
      "name": "右中央后岛盖 2",
      "color": "#7E7E56",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 106
    },
    {
      "id": "R_TA2_ROI",
      "name": "右颞叶听觉联合区 TA2",
      "color": "#892B22",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 107
    },
    {
      "id": "R_FOP4_ROI",
      "name": "右额叶岛盖 4",
      "color": "#CC9E94",
      "lobe": "frontal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 108
    },
    {
      "id": "R_MI_ROI",
      "name": "右岛叶运动区 MI",
      "color": "#A98276",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 109
    },
    {
      "id": "R_Pir_ROI",
      "name": "右梨状皮层 Pir",
      "color": "#34414B",
      "lobe": "temporal",
      "aliases": [
        "右梨状",
        "梨状"
      ],
      "hemi": "right",
      "label_id": 110
    },
    {
      "id": "R_AVI_ROI",
      "name": "右前腹岛叶 AVI",
      "color": "#9B5160",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 111
    },
    {
      "id": "R_AAIC_ROI",
      "name": "右前岛叶前部 AAIC",
      "color": "#4E2A35",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 112
    },
    {
      "id": "R_FOP1_ROI",
      "name": "右额叶岛盖 1",
      "color": "#A18D5B",
      "lobe": "frontal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 113
    },
    {
      "id": "R_FOP3_ROI",
      "name": "右额叶岛盖 3",
      "color": "#BA9271",
      "lobe": "frontal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 114
    },
    {
      "id": "R_FOP2_ROI",
      "name": "右额叶岛盖 2",
      "color": "#61A336",
      "lobe": "frontal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 115
    },
    {
      "id": "R_PFt_ROI",
      "name": "右顶下小叶 PFt",
      "color": "#68D175",
      "lobe": "parietal",
      "aliases": [
        "右顶下小叶",
        "顶下小叶"
      ],
      "hemi": "right",
      "label_id": 116
    },
    {
      "id": "R_AIP_ROI",
      "name": "右前顶内沟 AIP",
      "color": "#84E4AC",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 117
    },
    {
      "id": "R_EC_ROI",
      "name": "右嗅周皮层 EC",
      "color": "#2C3326",
      "lobe": "temporal",
      "aliases": [
        "右嗅周",
        "嗅周"
      ],
      "hemi": "right",
      "label_id": 118
    },
    {
      "id": "R_PreS_ROI",
      "name": "右旁海马回前部 PreS",
      "color": "#533E5A",
      "lobe": "temporal",
      "aliases": [
        "右旁海马",
        "旁海马"
      ],
      "hemi": "right",
      "label_id": 119
    },
    {
      "id": "R_H_ROI",
      "name": "右海马 H",
      "color": "#3B3D2C",
      "lobe": "temporal",
      "aliases": [
        "右海马",
        "海马"
      ],
      "hemi": "right",
      "label_id": 120
    },
    {
      "id": "R_ProS_ROI",
      "name": "右海马旁回后部 ProS",
      "color": "#5549B2",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 121
    },
    {
      "id": "R_PeEc_ROI",
      "name": "右嗅周皮层后部 PeEc",
      "color": "#343F33",
      "lobe": "temporal",
      "aliases": [
        "右嗅周",
        "嗅周"
      ],
      "hemi": "right",
      "label_id": 122
    },
    {
      "id": "R_STGa_ROI",
      "name": "右颞上回前部 STGa",
      "color": "#33321F",
      "lobe": "temporal",
      "aliases": [
        "右颞上回",
        "颞上回"
      ],
      "hemi": "right",
      "label_id": 123
    },
    {
      "id": "R_PBelt_ROI",
      "name": "右后听觉带 PBelt",
      "color": "#C01D0A",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 124
    },
    {
      "id": "R_A5_ROI",
      "name": "右听觉联合区 A5",
      "color": "#6E2703",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 125
    },
    {
      "id": "R_PHA1_ROI",
      "name": "右海马旁回 1",
      "color": "#3C3E4E",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 126
    },
    {
      "id": "R_PHA3_ROI",
      "name": "右海马旁回 3",
      "color": "#4C6A72",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 127
    },
    {
      "id": "R_STSda_ROI",
      "name": "右颞上沟背前 STSda",
      "color": "#463828",
      "lobe": "temporal",
      "aliases": [
        "右颞上沟",
        "颞上沟"
      ],
      "hemi": "right",
      "label_id": 128
    },
    {
      "id": "R_STSdp_ROI",
      "name": "右颞上沟背后 STSdp",
      "color": "#5D3A30",
      "lobe": "temporal",
      "aliases": [
        "右颞上沟",
        "颞上沟"
      ],
      "hemi": "right",
      "label_id": 129
    },
    {
      "id": "R_STSvp_ROI",
      "name": "右颞上沟腹后 STSvp",
      "color": "#59313D",
      "lobe": "temporal",
      "aliases": [
        "右颞上沟",
        "颞上沟"
      ],
      "hemi": "right",
      "label_id": 130
    },
    {
      "id": "R_TGd_ROI",
      "name": "右颞极背侧 TGd",
      "color": "#1F261C",
      "lobe": "temporal",
      "aliases": [
        "右颞极",
        "颞极"
      ],
      "hemi": "right",
      "label_id": 131
    },
    {
      "id": "R_TE1a_ROI",
      "name": "右颞下回前部 TE1a",
      "color": "#070C00",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 132
    },
    {
      "id": "R_TE1p_ROI",
      "name": "右颞下回后部 TE1p",
      "color": "#696D68",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 133
    },
    {
      "id": "R_TE2a_ROI",
      "name": "右颞下回前部 TE2a",
      "color": "#413F3B",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 134
    },
    {
      "id": "R_TF_ROI",
      "name": "右颞下回后部 TF",
      "color": "#3B5140",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 135
    },
    {
      "id": "R_TE2p_ROI",
      "name": "右颞下回后部 TE2p",
      "color": "#5F8678",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 136
    },
    {
      "id": "R_PHT_ROI",
      "name": "右颞叶海马旁回 PHT",
      "color": "#C2FAD4",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 137
    },
    {
      "id": "R_PH_ROI",
      "name": "右海马旁回 PH",
      "color": "#4690A6",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 138
    },
    {
      "id": "R_TPOJ1_ROI",
      "name": "右颞顶枕交界 1",
      "color": "#7E6452",
      "lobe": "parietal",
      "aliases": [
        "右颞顶枕",
        "颞顶枕"
      ],
      "hemi": "right",
      "label_id": 139
    },
    {
      "id": "R_TPOJ2_ROI",
      "name": "右颞顶枕交界 2",
      "color": "#8AB08F",
      "lobe": "parietal",
      "aliases": [
        "右颞顶枕",
        "颞顶枕"
      ],
      "hemi": "right",
      "label_id": 140
    },
    {
      "id": "R_TPOJ3_ROI",
      "name": "右颞顶枕交界 3",
      "color": "#619B8C",
      "lobe": "parietal",
      "aliases": [
        "右颞顶枕",
        "颞顶枕"
      ],
      "hemi": "right",
      "label_id": 141
    },
    {
      "id": "R_DVT_ROI",
      "name": "右背侧视觉通路颞顶区",
      "color": "#7D89CB",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 142
    },
    {
      "id": "R_PGp_ROI",
      "name": "右角回 PGp",
      "color": "#90D6DD",
      "lobe": "parietal",
      "aliases": [
        "右角回",
        "角回"
      ],
      "hemi": "right",
      "label_id": 143
    },
    {
      "id": "R_IP2_ROI",
      "name": "右顶内沟 2",
      "color": "#B9B5B5",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 144
    },
    {
      "id": "R_IP1_ROI",
      "name": "右顶内沟 1",
      "color": "#7C7B81",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 145
    },
    {
      "id": "R_IP0_ROI",
      "name": "右顶内沟 0",
      "color": "#6BB3D7",
      "lobe": "parietal",
      "aliases": [
        "右顶内沟",
        "顶内沟"
      ],
      "hemi": "right",
      "label_id": 146
    },
    {
      "id": "R_PFop_ROI",
      "name": "右顶盖区 PFop",
      "color": "#AAC988",
      "lobe": "parietal",
      "aliases": [
        "右顶盖",
        "顶盖"
      ],
      "hemi": "right",
      "label_id": 147
    },
    {
      "id": "R_PF_ROI",
      "name": "右顶下小叶 PF",
      "color": "#FFFFDD",
      "lobe": "parietal",
      "aliases": [
        "右顶下小叶",
        "顶下小叶"
      ],
      "hemi": "right",
      "label_id": 148
    },
    {
      "id": "R_PFm_ROI",
      "name": "右顶下小叶 PFm",
      "color": "#A07C86",
      "lobe": "parietal",
      "aliases": [
        "右顶下小叶",
        "顶下小叶"
      ],
      "hemi": "right",
      "label_id": 149
    },
    {
      "id": "R_PGi_ROI",
      "name": "右顶下小叶 PGi",
      "color": "#363E31",
      "lobe": "parietal",
      "aliases": [
        "右顶下小叶",
        "顶下小叶"
      ],
      "hemi": "right",
      "label_id": 150
    },
    {
      "id": "R_PGs_ROI",
      "name": "右缘上回 PGs",
      "color": "#594F4C",
      "lobe": "parietal",
      "aliases": [
        "右缘上回",
        "缘上回"
      ],
      "hemi": "right",
      "label_id": 151
    },
    {
      "id": "R_V6A_ROI",
      "name": "右第六视皮层 A V6A",
      "color": "#3264AA",
      "lobe": "occipital",
      "aliases": [
        "右V6A",
        "V6A"
      ],
      "hemi": "right",
      "label_id": 152
    },
    {
      "id": "R_VMV1_ROI",
      "name": "右腹内侧视觉区 VMV1",
      "color": "#334CA6",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 153
    },
    {
      "id": "R_VMV3_ROI",
      "name": "右腹内侧视觉区 VMV3",
      "color": "#2A45AB",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 154
    },
    {
      "id": "R_PHA2_ROI",
      "name": "右海马旁回 2",
      "color": "#4A6661",
      "lobe": "temporal",
      "aliases": [
        "右海马旁回",
        "海马旁回"
      ],
      "hemi": "right",
      "label_id": 155
    },
    {
      "id": "R_V4t_ROI",
      "name": "右颞区 V4t",
      "color": "#0D6980",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 156
    },
    {
      "id": "R_FST_ROI",
      "name": "右颞上沟底部 FST",
      "color": "#49A495",
      "lobe": "temporal",
      "aliases": [
        "右颞上沟",
        "颞上沟"
      ],
      "hemi": "right",
      "label_id": 157
    },
    {
      "id": "R_V3CD_ROI",
      "name": "右第三视皮层 CD V3CD",
      "color": "#1649CC",
      "lobe": "occipital",
      "aliases": [
        "右V3CD",
        "V3CD"
      ],
      "hemi": "right",
      "label_id": 158
    },
    {
      "id": "R_LO3_ROI",
      "name": "右外侧枕叶 3",
      "color": "#386DAA",
      "lobe": "occipital",
      "aliases": [
        "右外侧枕叶",
        "外侧枕叶"
      ],
      "hemi": "right",
      "label_id": 159
    },
    {
      "id": "R_VMV2_ROI",
      "name": "右腹内侧视觉区 VMV2",
      "color": "#3B4CAD",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 160
    },
    {
      "id": "R_31pd_ROI",
      "name": "右后扣带回 31pd",
      "color": "#4E1B3C",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 161
    },
    {
      "id": "R_31a_ROI",
      "name": "右后扣带回 31a",
      "color": "#8D6B86",
      "lobe": "cingulate",
      "aliases": [
        "右后扣带",
        "后扣带"
      ],
      "hemi": "right",
      "label_id": 162
    },
    {
      "id": "R_VVC_ROI",
      "name": "右腹侧视觉皮层 VVC",
      "color": "#355087",
      "lobe": "occipital",
      "aliases": [
        "右腹侧视觉",
        "腹侧视觉"
      ],
      "hemi": "right",
      "label_id": 163
    },
    {
      "id": "R_25_ROI",
      "name": "右膝下前扣带 25",
      "color": "#1A130C",
      "lobe": "cingulate",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 164
    },
    {
      "id": "R_s32_ROI",
      "name": "右辅助运动区前部",
      "color": "#1B1309",
      "lobe": "frontal",
      "aliases": [
        "右辅助运动",
        "辅助运动"
      ],
      "hemi": "right",
      "label_id": 165
    },
    {
      "id": "R_pOFC_ROI",
      "name": "右眶额后部 pOFC",
      "color": "#4D353D",
      "lobe": "frontal",
      "aliases": [
        "右眶额",
        "眶额"
      ],
      "hemi": "right",
      "label_id": 166
    },
    {
      "id": "R_PoI1_ROI",
      "name": "右中央后岛盖 1",
      "color": "#A66B67",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 167
    },
    {
      "id": "R_Ig_ROI",
      "name": "右颗粒岛叶 Ig",
      "color": "#6C8229",
      "lobe": "insula",
      "aliases": [
        "右岛叶",
        "岛叶"
      ],
      "hemi": "right",
      "label_id": 168
    },
    {
      "id": "R_FOP5_ROI",
      "name": "右额叶岛盖 5",
      "color": "#B86A77",
      "lobe": "frontal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 169
    },
    {
      "id": "R_p10p_ROI",
      "name": "右额极后部 p10p",
      "color": "#5C4653",
      "lobe": "frontal",
      "aliases": [
        "右前额极",
        "前额极"
      ],
      "hemi": "right",
      "label_id": 170
    },
    {
      "id": "R_p47r_ROI",
      "name": "右额下回后部 p47r",
      "color": "#957A7A",
      "lobe": "frontal",
      "aliases": [
        "右额下回",
        "额下回"
      ],
      "hemi": "right",
      "label_id": 171
    },
    {
      "id": "R_TGv_ROI",
      "name": "右颞极腹侧 TGv",
      "color": "#384136",
      "lobe": "temporal",
      "aliases": [
        "右颞极",
        "颞极"
      ],
      "hemi": "right",
      "label_id": 172
    },
    {
      "id": "R_MBelt_ROI",
      "name": "右内侧听觉带 MBelt",
      "color": "#BC111A",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 173
    },
    {
      "id": "R_LBelt_ROI",
      "name": "右外侧听觉带 LBelt",
      "color": "#D8181C",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 174
    },
    {
      "id": "R_A4_ROI",
      "name": "右听觉联合区 A4",
      "color": "#962808",
      "lobe": "temporal",
      "aliases": [
        "右听觉",
        "听觉"
      ],
      "hemi": "right",
      "label_id": 175
    },
    {
      "id": "R_STSva_ROI",
      "name": "右颞上沟腹前 STSva",
      "color": "#312823",
      "lobe": "temporal",
      "aliases": [
        "右颞上沟",
        "颞上沟"
      ],
      "hemi": "right",
      "label_id": 176
    },
    {
      "id": "R_TE1m_ROI",
      "name": "右颞下回中部 TE1m",
      "color": "#52363B",
      "lobe": "temporal",
      "aliases": [
        "右颞下回",
        "颞下回"
      ],
      "hemi": "right",
      "label_id": 177
    },
    {
      "id": "R_PI_ROI",
      "name": "右顶叶岛盖后部 PI",
      "color": "#813B3E",
      "lobe": "parietal",
      "aliases": [
        "右岛盖",
        "岛盖"
      ],
      "hemi": "right",
      "label_id": 178
    },
    {
      "id": "R_a32pr_ROI",
      "name": "右前扣带 32 前部",
      "color": "#98516D",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 179
    },
    {
      "id": "R_p24_ROI",
      "name": "右后扣带回前部 p24",
      "color": "#7A2C51",
      "lobe": "frontal",
      "aliases": [
        "右前扣带",
        "前扣带"
      ],
      "hemi": "right",
      "label_id": 180
    }
  ],
  "desikan": [
    {
      "id": "lh_bankssts",
      "name": "bankssts",
      "color": "#196428",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 1
    },
    {
      "id": "lh_caudalanteriorcingulate",
      "name": "caudalanteriorcingulate",
      "color": "#7D64A0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 2
    },
    {
      "id": "lh_caudalmiddlefrontal",
      "name": "caudalmiddlefrontal",
      "color": "#641900",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 3
    },
    {
      "id": "lh_cuneus",
      "name": "cuneus",
      "color": "#DC1464",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 5
    },
    {
      "id": "lh_entorhinal",
      "name": "entorhinal",
      "color": "#DC140A",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 6
    },
    {
      "id": "lh_fusiform",
      "name": "fusiform",
      "color": "#B4DC8C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 7
    },
    {
      "id": "lh_inferiorparietal",
      "name": "inferiorparietal",
      "color": "#DC3CDC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 8
    },
    {
      "id": "lh_inferiortemporal",
      "name": "inferiortemporal",
      "color": "#B42878",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 9
    },
    {
      "id": "lh_isthmuscingulate",
      "name": "isthmuscingulate",
      "color": "#8C148C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 10
    },
    {
      "id": "lh_lateraloccipital",
      "name": "lateraloccipital",
      "color": "#141E8C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 11
    },
    {
      "id": "lh_lateralorbitofrontal",
      "name": "lateralorbitofrontal",
      "color": "#234B32",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 12
    },
    {
      "id": "lh_lingual",
      "name": "lingual",
      "color": "#E18C8C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 13
    },
    {
      "id": "lh_medialorbitofrontal",
      "name": "medialorbitofrontal",
      "color": "#C8234B",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 14
    },
    {
      "id": "lh_middletemporal",
      "name": "middletemporal",
      "color": "#A06432",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 15
    },
    {
      "id": "lh_parahippocampal",
      "name": "parahippocampal",
      "color": "#14DC3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 16
    },
    {
      "id": "lh_paracentral",
      "name": "paracentral",
      "color": "#3CDC3C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 17
    },
    {
      "id": "lh_parsopercularis",
      "name": "parsopercularis",
      "color": "#DCB48C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 18
    },
    {
      "id": "lh_parsorbitalis",
      "name": "parsorbitalis",
      "color": "#146432",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 19
    },
    {
      "id": "lh_parstriangularis",
      "name": "parstriangularis",
      "color": "#DC3C14",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 20
    },
    {
      "id": "lh_pericalcarine",
      "name": "pericalcarine",
      "color": "#78643C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 21
    },
    {
      "id": "lh_postcentral",
      "name": "postcentral",
      "color": "#DC1414",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 22
    },
    {
      "id": "lh_posteriorcingulate",
      "name": "posteriorcingulate",
      "color": "#DCB4DC",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 23
    },
    {
      "id": "lh_precentral",
      "name": "precentral",
      "color": "#3C14DC",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 24
    },
    {
      "id": "lh_precuneus",
      "name": "precuneus",
      "color": "#A08CB4",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 25
    },
    {
      "id": "lh_rostralanteriorcingulate",
      "name": "rostralanteriorcingulate",
      "color": "#50148C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 26
    },
    {
      "id": "lh_rostralmiddlefrontal",
      "name": "rostralmiddlefrontal",
      "color": "#4B327D",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 27
    },
    {
      "id": "lh_superiorfrontal",
      "name": "superiorfrontal",
      "color": "#14DCA0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 28
    },
    {
      "id": "lh_superiorparietal",
      "name": "superiorparietal",
      "color": "#14B48C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 29
    },
    {
      "id": "lh_superiortemporal",
      "name": "superiortemporal",
      "color": "#8CDCDC",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 30
    },
    {
      "id": "lh_supramarginal",
      "name": "supramarginal",
      "color": "#50A014",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 31
    },
    {
      "id": "lh_frontalpole",
      "name": "frontalpole",
      "color": "#640064",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 32
    },
    {
      "id": "lh_temporalpole",
      "name": "temporalpole",
      "color": "#4614AA",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 33
    },
    {
      "id": "lh_transversetemporal",
      "name": "transversetemporal",
      "color": "#9696C8",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 34
    },
    {
      "id": "lh_insula",
      "name": "insula",
      "color": "#FFC020",
      "lobe": "insula",
      "aliases": [],
      "hemi": "left",
      "label_id": 35
    },
    {
      "id": "rh_bankssts",
      "name": "bankssts",
      "color": "#196428",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 1
    },
    {
      "id": "rh_caudalanteriorcingulate",
      "name": "caudalanteriorcingulate",
      "color": "#7D64A0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 2
    },
    {
      "id": "rh_caudalmiddlefrontal",
      "name": "caudalmiddlefrontal",
      "color": "#641900",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 3
    },
    {
      "id": "rh_cuneus",
      "name": "cuneus",
      "color": "#DC1464",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 5
    },
    {
      "id": "rh_entorhinal",
      "name": "entorhinal",
      "color": "#DC140A",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 6
    },
    {
      "id": "rh_fusiform",
      "name": "fusiform",
      "color": "#B4DC8C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 7
    },
    {
      "id": "rh_inferiorparietal",
      "name": "inferiorparietal",
      "color": "#DC3CDC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 8
    },
    {
      "id": "rh_inferiortemporal",
      "name": "inferiortemporal",
      "color": "#B42878",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 9
    },
    {
      "id": "rh_isthmuscingulate",
      "name": "isthmuscingulate",
      "color": "#8C148C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 10
    },
    {
      "id": "rh_lateraloccipital",
      "name": "lateraloccipital",
      "color": "#141E8C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 11
    },
    {
      "id": "rh_lateralorbitofrontal",
      "name": "lateralorbitofrontal",
      "color": "#234B32",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 12
    },
    {
      "id": "rh_lingual",
      "name": "lingual",
      "color": "#E18C8C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 13
    },
    {
      "id": "rh_medialorbitofrontal",
      "name": "medialorbitofrontal",
      "color": "#C8234B",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 14
    },
    {
      "id": "rh_middletemporal",
      "name": "middletemporal",
      "color": "#A06432",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 15
    },
    {
      "id": "rh_parahippocampal",
      "name": "parahippocampal",
      "color": "#14DC3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 16
    },
    {
      "id": "rh_paracentral",
      "name": "paracentral",
      "color": "#3CDC3C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 17
    },
    {
      "id": "rh_parsopercularis",
      "name": "parsopercularis",
      "color": "#DCB48C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 18
    },
    {
      "id": "rh_parsorbitalis",
      "name": "parsorbitalis",
      "color": "#146432",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 19
    },
    {
      "id": "rh_parstriangularis",
      "name": "parstriangularis",
      "color": "#DC3C14",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 20
    },
    {
      "id": "rh_pericalcarine",
      "name": "pericalcarine",
      "color": "#78643C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 21
    },
    {
      "id": "rh_postcentral",
      "name": "postcentral",
      "color": "#DC1414",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 22
    },
    {
      "id": "rh_posteriorcingulate",
      "name": "posteriorcingulate",
      "color": "#DCB4DC",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 23
    },
    {
      "id": "rh_precentral",
      "name": "precentral",
      "color": "#3C14DC",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 24
    },
    {
      "id": "rh_precuneus",
      "name": "precuneus",
      "color": "#A08CB4",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 25
    },
    {
      "id": "rh_rostralanteriorcingulate",
      "name": "rostralanteriorcingulate",
      "color": "#50148C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 26
    },
    {
      "id": "rh_rostralmiddlefrontal",
      "name": "rostralmiddlefrontal",
      "color": "#4B327D",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 27
    },
    {
      "id": "rh_superiorfrontal",
      "name": "superiorfrontal",
      "color": "#14DCA0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 28
    },
    {
      "id": "rh_superiorparietal",
      "name": "superiorparietal",
      "color": "#14B48C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 29
    },
    {
      "id": "rh_superiortemporal",
      "name": "superiortemporal",
      "color": "#8CDCDC",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 30
    },
    {
      "id": "rh_supramarginal",
      "name": "supramarginal",
      "color": "#50A014",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 31
    },
    {
      "id": "rh_frontalpole",
      "name": "frontalpole",
      "color": "#640064",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 32
    },
    {
      "id": "rh_temporalpole",
      "name": "temporalpole",
      "color": "#4614AA",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 33
    },
    {
      "id": "rh_transversetemporal",
      "name": "transversetemporal",
      "color": "#9696C8",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 34
    },
    {
      "id": "rh_insula",
      "name": "insula",
      "color": "#FFC020",
      "lobe": "insula",
      "aliases": [],
      "hemi": "right",
      "label_id": 35
    }
  ],
  "destrieux": [
    {
      "id": "lh_G_and_S_frontomargin",
      "name": "G_and_S_frontomargin",
      "color": "#17DC3C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 1
    },
    {
      "id": "lh_G_and_S_occipital_inf",
      "name": "G_and_S_occipital_inf",
      "color": "#173CB4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 2
    },
    {
      "id": "lh_G_and_S_paracentral",
      "name": "G_and_S_paracentral",
      "color": "#3F643C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 3
    },
    {
      "id": "lh_G_and_S_subcentral",
      "name": "G_and_S_subcentral",
      "color": "#3F14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 4
    },
    {
      "id": "lh_G_and_S_transv_frontopol",
      "name": "G_and_S_transv_frontopol",
      "color": "#0D00FA",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 5
    },
    {
      "id": "lh_G_and_S_cingul-Ant",
      "name": "G_and_S_cingul-Ant",
      "color": "#1A3C00",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 6
    },
    {
      "id": "lh_G_and_S_cingul-Mid-Ant",
      "name": "G_and_S_cingul-Mid-Ant",
      "color": "#1A3C4B",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 7
    },
    {
      "id": "lh_G_and_S_cingul-Mid-Post",
      "name": "G_and_S_cingul-Mid-Post",
      "color": "#1A3C96",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 8
    },
    {
      "id": "lh_G_cingul-Post-dorsal",
      "name": "G_cingul-Post-dorsal",
      "color": "#193CFA",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 9
    },
    {
      "id": "lh_G_cingul-Post-ventral",
      "name": "G_cingul-Post-ventral",
      "color": "#3C1919",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 10
    },
    {
      "id": "lh_G_cuneus",
      "name": "G_cuneus",
      "color": "#B41414",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 11
    },
    {
      "id": "lh_G_front_inf-Opercular",
      "name": "G_front_inf-Opercular",
      "color": "#DC1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 12
    },
    {
      "id": "lh_G_front_inf-Orbital",
      "name": "G_front_inf-Orbital",
      "color": "#8C3C3C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 13
    },
    {
      "id": "lh_G_front_inf-Triangul",
      "name": "G_front_inf-Triangul",
      "color": "#B4DC8C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 14
    },
    {
      "id": "lh_G_front_middle",
      "name": "G_front_middle",
      "color": "#8C64B4",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 15
    },
    {
      "id": "lh_G_front_sup",
      "name": "G_front_sup",
      "color": "#B4148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 16
    },
    {
      "id": "lh_G_Ins_lg_and_S_cent_ins",
      "name": "G_Ins_lg_and_S_cent_ins",
      "color": "#170A0A",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 17
    },
    {
      "id": "lh_G_insular_short",
      "name": "G_insular_short",
      "color": "#E18C8C",
      "lobe": "insula",
      "aliases": [],
      "hemi": "left",
      "label_id": 18
    },
    {
      "id": "lh_G_occipital_middle",
      "name": "G_occipital_middle",
      "color": "#B43CB4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 19
    },
    {
      "id": "lh_G_occipital_sup",
      "name": "G_occipital_sup",
      "color": "#14DC3C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 20
    },
    {
      "id": "lh_G_oc-temp_lat-fusifor",
      "name": "G_oc-temp_lat-fusifor",
      "color": "#3C148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 21
    },
    {
      "id": "lh_G_oc-temp_med-Lingual",
      "name": "G_oc-temp_med-Lingual",
      "color": "#DCB48C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 22
    },
    {
      "id": "lh_G_oc-temp_med-Parahip",
      "name": "G_oc-temp_med-Parahip",
      "color": "#416414",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 23
    },
    {
      "id": "lh_G_orbital",
      "name": "G_orbital",
      "color": "#DC3C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 24
    },
    {
      "id": "lh_G_pariet_inf-Angular",
      "name": "G_pariet_inf-Angular",
      "color": "#143CDC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 25
    },
    {
      "id": "lh_G_pariet_inf-Supramar",
      "name": "G_pariet_inf-Supramar",
      "color": "#64643C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 26
    },
    {
      "id": "lh_G_parietal_sup",
      "name": "G_parietal_sup",
      "color": "#DCB4DC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 27
    },
    {
      "id": "lh_G_postcentral",
      "name": "G_postcentral",
      "color": "#14B48C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 28
    },
    {
      "id": "lh_G_precentral",
      "name": "G_precentral",
      "color": "#3C8CB4",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 29
    },
    {
      "id": "lh_G_precuneus",
      "name": "G_precuneus",
      "color": "#19148C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 30
    },
    {
      "id": "lh_G_rectus",
      "name": "G_rectus",
      "color": "#143C64",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 31
    },
    {
      "id": "lh_G_subcallosal",
      "name": "G_subcallosal",
      "color": "#3CDC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 32
    },
    {
      "id": "lh_G_temp_sup-G_T_transv",
      "name": "G_temp_sup-G_T_transv",
      "color": "#3C3CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 33
    },
    {
      "id": "lh_G_temp_sup-Lateral",
      "name": "G_temp_sup-Lateral",
      "color": "#DC3CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 34
    },
    {
      "id": "lh_G_temp_sup-Plan_polar",
      "name": "G_temp_sup-Plan_polar",
      "color": "#41DC3C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 35
    },
    {
      "id": "lh_G_temp_sup-Plan_tempo",
      "name": "G_temp_sup-Plan_tempo",
      "color": "#198C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 36
    },
    {
      "id": "lh_G_temporal_inf",
      "name": "G_temporal_inf",
      "color": "#DCDC64",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 37
    },
    {
      "id": "lh_G_temporal_middle",
      "name": "G_temporal_middle",
      "color": "#B43C3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 38
    },
    {
      "id": "lh_Lat_Fis-ant-Horizont",
      "name": "Lat_Fis-ant-Horizont",
      "color": "#3D14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 39
    },
    {
      "id": "lh_Lat_Fis-ant-Vertical",
      "name": "Lat_Fis-ant-Vertical",
      "color": "#3D143C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 40
    },
    {
      "id": "lh_Lat_Fis-post",
      "name": "Lat_Fis-post",
      "color": "#3D3C64",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 41
    },
    {
      "id": "lh_Medial_wall",
      "name": "Medial_wall",
      "color": "#191919",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 42
    },
    {
      "id": "lh_Pole_occipital",
      "name": "Pole_occipital",
      "color": "#8C143C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 43
    },
    {
      "id": "lh_Pole_temporal",
      "name": "Pole_temporal",
      "color": "#DCB414",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 44
    },
    {
      "id": "lh_S_calcarine",
      "name": "S_calcarine",
      "color": "#3FB4B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 45
    },
    {
      "id": "lh_S_central",
      "name": "S_central",
      "color": "#DD140A",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 46
    },
    {
      "id": "lh_S_cingul-Marginalis",
      "name": "S_cingul-Marginalis",
      "color": "#DD1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 47
    },
    {
      "id": "lh_S_circular_insula_ant",
      "name": "S_circular_insula_ant",
      "color": "#DD3C8C",
      "lobe": "insula",
      "aliases": [],
      "hemi": "left",
      "label_id": 48
    },
    {
      "id": "lh_S_circular_insula_inf",
      "name": "S_circular_insula_inf",
      "color": "#DD14DC",
      "lobe": "insula",
      "aliases": [],
      "hemi": "left",
      "label_id": 49
    },
    {
      "id": "lh_S_circular_insula_sup",
      "name": "S_circular_insula_sup",
      "color": "#3DDCDC",
      "lobe": "insula",
      "aliases": [],
      "hemi": "left",
      "label_id": 50
    },
    {
      "id": "lh_S_collat_transv_ant",
      "name": "S_collat_transv_ant",
      "color": "#64C8C8",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 51
    },
    {
      "id": "lh_S_collat_transv_post",
      "name": "S_collat_transv_post",
      "color": "#0AC8C8",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 52
    },
    {
      "id": "lh_S_front_inf",
      "name": "S_front_inf",
      "color": "#DDDC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 53
    },
    {
      "id": "lh_S_front_middle",
      "name": "S_front_middle",
      "color": "#8D1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 54
    },
    {
      "id": "lh_S_front_sup",
      "name": "S_front_sup",
      "color": "#3DDC64",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 55
    },
    {
      "id": "lh_S_interm_prim-Jensen",
      "name": "S_interm_prim-Jensen",
      "color": "#8D3C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 56
    },
    {
      "id": "lh_S_intrapariet_and_P_trans",
      "name": "S_intrapariet_and_P_trans",
      "color": "#8F14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 57
    },
    {
      "id": "lh_S_oc_middle_and_Lunatus",
      "name": "S_oc_middle_and_Lunatus",
      "color": "#653CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 58
    },
    {
      "id": "lh_S_oc_sup_and_transversal",
      "name": "S_oc_sup_and_transversal",
      "color": "#15148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 59
    },
    {
      "id": "lh_S_occipital_ant",
      "name": "S_occipital_ant",
      "color": "#3D14B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 60
    },
    {
      "id": "lh_S_oc-temp_lat",
      "name": "S_oc-temp_lat",
      "color": "#DD8C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 61
    },
    {
      "id": "lh_S_oc-temp_med_and_Lingual",
      "name": "S_oc-temp_med_and_Lingual",
      "color": "#8D64DC",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 62
    },
    {
      "id": "lh_S_orbital_lateral",
      "name": "S_orbital_lateral",
      "color": "#DD6414",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 63
    },
    {
      "id": "lh_S_orbital_med-olfact",
      "name": "S_orbital_med-olfact",
      "color": "#B5C814",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 64
    },
    {
      "id": "lh_S_orbital-H_Shaped",
      "name": "S_orbital-H_Shaped",
      "color": "#651414",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 65
    },
    {
      "id": "lh_S_parieto_occipital",
      "name": "S_parieto_occipital",
      "color": "#6564B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "left",
      "label_id": 66
    },
    {
      "id": "lh_S_pericallosal",
      "name": "S_pericallosal",
      "color": "#B5DC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 67
    },
    {
      "id": "lh_S_postcentral",
      "name": "S_postcentral",
      "color": "#158CC8",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 68
    },
    {
      "id": "lh_S_precentral-inf-part",
      "name": "S_precentral-inf-part",
      "color": "#1514F0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 69
    },
    {
      "id": "lh_S_precentral-sup-part",
      "name": "S_precentral-sup-part",
      "color": "#1514C8",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "left",
      "label_id": 70
    },
    {
      "id": "lh_S_suborbital",
      "name": "S_suborbital",
      "color": "#15143C",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 71
    },
    {
      "id": "lh_S_subparietal",
      "name": "S_subparietal",
      "color": "#653C3C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "left",
      "label_id": 72
    },
    {
      "id": "lh_S_temporal_inf",
      "name": "S_temporal_inf",
      "color": "#15B4B4",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 73
    },
    {
      "id": "lh_S_temporal_sup",
      "name": "S_temporal_sup",
      "color": "#DFDC3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 74
    },
    {
      "id": "lh_S_temporal_transverse",
      "name": "S_temporal_transverse",
      "color": "#DD3C3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "left",
      "label_id": 75
    },
    {
      "id": "rh_G_and_S_frontomargin",
      "name": "G_and_S_frontomargin",
      "color": "#17DC3C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 1
    },
    {
      "id": "rh_G_and_S_occipital_inf",
      "name": "G_and_S_occipital_inf",
      "color": "#173CB4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 2
    },
    {
      "id": "rh_G_and_S_paracentral",
      "name": "G_and_S_paracentral",
      "color": "#3F643C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 3
    },
    {
      "id": "rh_G_and_S_subcentral",
      "name": "G_and_S_subcentral",
      "color": "#3F14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 4
    },
    {
      "id": "rh_G_and_S_transv_frontopol",
      "name": "G_and_S_transv_frontopol",
      "color": "#0D00FA",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 5
    },
    {
      "id": "rh_G_and_S_cingul-Ant",
      "name": "G_and_S_cingul-Ant",
      "color": "#1A3C00",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 6
    },
    {
      "id": "rh_G_and_S_cingul-Mid-Ant",
      "name": "G_and_S_cingul-Mid-Ant",
      "color": "#1A3C4B",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 7
    },
    {
      "id": "rh_G_and_S_cingul-Mid-Post",
      "name": "G_and_S_cingul-Mid-Post",
      "color": "#1A3C96",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 8
    },
    {
      "id": "rh_G_cingul-Post-dorsal",
      "name": "G_cingul-Post-dorsal",
      "color": "#193CFA",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 9
    },
    {
      "id": "rh_G_cingul-Post-ventral",
      "name": "G_cingul-Post-ventral",
      "color": "#3C1919",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 10
    },
    {
      "id": "rh_G_cuneus",
      "name": "G_cuneus",
      "color": "#B41414",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 11
    },
    {
      "id": "rh_G_front_inf-Opercular",
      "name": "G_front_inf-Opercular",
      "color": "#DC1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 12
    },
    {
      "id": "rh_G_front_inf-Orbital",
      "name": "G_front_inf-Orbital",
      "color": "#8C3C3C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 13
    },
    {
      "id": "rh_G_front_inf-Triangul",
      "name": "G_front_inf-Triangul",
      "color": "#B4DC8C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 14
    },
    {
      "id": "rh_G_front_middle",
      "name": "G_front_middle",
      "color": "#8C64B4",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 15
    },
    {
      "id": "rh_G_front_sup",
      "name": "G_front_sup",
      "color": "#B4148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 16
    },
    {
      "id": "rh_G_Ins_lg_and_S_cent_ins",
      "name": "G_Ins_lg_and_S_cent_ins",
      "color": "#170A0A",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 17
    },
    {
      "id": "rh_G_insular_short",
      "name": "G_insular_short",
      "color": "#E18C8C",
      "lobe": "insula",
      "aliases": [],
      "hemi": "right",
      "label_id": 18
    },
    {
      "id": "rh_G_occipital_middle",
      "name": "G_occipital_middle",
      "color": "#B43CB4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 19
    },
    {
      "id": "rh_G_occipital_sup",
      "name": "G_occipital_sup",
      "color": "#14DC3C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 20
    },
    {
      "id": "rh_G_oc-temp_lat-fusifor",
      "name": "G_oc-temp_lat-fusifor",
      "color": "#3C148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 21
    },
    {
      "id": "rh_G_oc-temp_med-Lingual",
      "name": "G_oc-temp_med-Lingual",
      "color": "#DCB48C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 22
    },
    {
      "id": "rh_G_oc-temp_med-Parahip",
      "name": "G_oc-temp_med-Parahip",
      "color": "#416414",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 23
    },
    {
      "id": "rh_G_orbital",
      "name": "G_orbital",
      "color": "#DC3C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 24
    },
    {
      "id": "rh_G_pariet_inf-Angular",
      "name": "G_pariet_inf-Angular",
      "color": "#143CDC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 25
    },
    {
      "id": "rh_G_pariet_inf-Supramar",
      "name": "G_pariet_inf-Supramar",
      "color": "#64643C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 26
    },
    {
      "id": "rh_G_parietal_sup",
      "name": "G_parietal_sup",
      "color": "#DCB4DC",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 27
    },
    {
      "id": "rh_G_postcentral",
      "name": "G_postcentral",
      "color": "#14B48C",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 28
    },
    {
      "id": "rh_G_precentral",
      "name": "G_precentral",
      "color": "#3C8CB4",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 29
    },
    {
      "id": "rh_G_precuneus",
      "name": "G_precuneus",
      "color": "#19148C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 30
    },
    {
      "id": "rh_G_rectus",
      "name": "G_rectus",
      "color": "#143C64",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 31
    },
    {
      "id": "rh_G_subcallosal",
      "name": "G_subcallosal",
      "color": "#3CDC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 32
    },
    {
      "id": "rh_G_temp_sup-G_T_transv",
      "name": "G_temp_sup-G_T_transv",
      "color": "#3C3CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 33
    },
    {
      "id": "rh_G_temp_sup-Lateral",
      "name": "G_temp_sup-Lateral",
      "color": "#DC3CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 34
    },
    {
      "id": "rh_G_temp_sup-Plan_polar",
      "name": "G_temp_sup-Plan_polar",
      "color": "#41DC3C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 35
    },
    {
      "id": "rh_G_temp_sup-Plan_tempo",
      "name": "G_temp_sup-Plan_tempo",
      "color": "#198C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 36
    },
    {
      "id": "rh_G_temporal_inf",
      "name": "G_temporal_inf",
      "color": "#DCDC64",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 37
    },
    {
      "id": "rh_G_temporal_middle",
      "name": "G_temporal_middle",
      "color": "#B43C3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 38
    },
    {
      "id": "rh_Lat_Fis-ant-Horizont",
      "name": "Lat_Fis-ant-Horizont",
      "color": "#3D14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 39
    },
    {
      "id": "rh_Lat_Fis-ant-Vertical",
      "name": "Lat_Fis-ant-Vertical",
      "color": "#3D143C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 40
    },
    {
      "id": "rh_Lat_Fis-post",
      "name": "Lat_Fis-post",
      "color": "#3D3C64",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 41
    },
    {
      "id": "rh_Medial_wall",
      "name": "Medial_wall",
      "color": "#191919",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 42
    },
    {
      "id": "rh_Pole_occipital",
      "name": "Pole_occipital",
      "color": "#8C143C",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 43
    },
    {
      "id": "rh_Pole_temporal",
      "name": "Pole_temporal",
      "color": "#DCB414",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 44
    },
    {
      "id": "rh_S_calcarine",
      "name": "S_calcarine",
      "color": "#3FB4B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 45
    },
    {
      "id": "rh_S_central",
      "name": "S_central",
      "color": "#DD140A",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 46
    },
    {
      "id": "rh_S_cingul-Marginalis",
      "name": "S_cingul-Marginalis",
      "color": "#DD1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 47
    },
    {
      "id": "rh_S_circular_insula_ant",
      "name": "S_circular_insula_ant",
      "color": "#DD3C8C",
      "lobe": "insula",
      "aliases": [],
      "hemi": "right",
      "label_id": 48
    },
    {
      "id": "rh_S_circular_insula_inf",
      "name": "S_circular_insula_inf",
      "color": "#DD14DC",
      "lobe": "insula",
      "aliases": [],
      "hemi": "right",
      "label_id": 49
    },
    {
      "id": "rh_S_circular_insula_sup",
      "name": "S_circular_insula_sup",
      "color": "#3DDCDC",
      "lobe": "insula",
      "aliases": [],
      "hemi": "right",
      "label_id": 50
    },
    {
      "id": "rh_S_collat_transv_ant",
      "name": "S_collat_transv_ant",
      "color": "#64C8C8",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 51
    },
    {
      "id": "rh_S_collat_transv_post",
      "name": "S_collat_transv_post",
      "color": "#0AC8C8",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 52
    },
    {
      "id": "rh_S_front_inf",
      "name": "S_front_inf",
      "color": "#DDDC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 53
    },
    {
      "id": "rh_S_front_middle",
      "name": "S_front_middle",
      "color": "#8D1464",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 54
    },
    {
      "id": "rh_S_front_sup",
      "name": "S_front_sup",
      "color": "#3DDC64",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 55
    },
    {
      "id": "rh_S_interm_prim-Jensen",
      "name": "S_interm_prim-Jensen",
      "color": "#8D3C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 56
    },
    {
      "id": "rh_S_intrapariet_and_P_trans",
      "name": "S_intrapariet_and_P_trans",
      "color": "#8F14DC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 57
    },
    {
      "id": "rh_S_oc_middle_and_Lunatus",
      "name": "S_oc_middle_and_Lunatus",
      "color": "#653CDC",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 58
    },
    {
      "id": "rh_S_oc_sup_and_transversal",
      "name": "S_oc_sup_and_transversal",
      "color": "#15148C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 59
    },
    {
      "id": "rh_S_occipital_ant",
      "name": "S_occipital_ant",
      "color": "#3D14B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 60
    },
    {
      "id": "rh_S_oc-temp_lat",
      "name": "S_oc-temp_lat",
      "color": "#DD8C14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 61
    },
    {
      "id": "rh_S_oc-temp_med_and_Lingual",
      "name": "S_oc-temp_med_and_Lingual",
      "color": "#8D64DC",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 62
    },
    {
      "id": "rh_S_orbital_lateral",
      "name": "S_orbital_lateral",
      "color": "#DD6414",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 63
    },
    {
      "id": "rh_S_orbital_med-olfact",
      "name": "S_orbital_med-olfact",
      "color": "#B5C814",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 64
    },
    {
      "id": "rh_S_orbital-H_Shaped",
      "name": "S_orbital-H_Shaped",
      "color": "#651414",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 65
    },
    {
      "id": "rh_S_parieto_occipital",
      "name": "S_parieto_occipital",
      "color": "#6564B4",
      "lobe": "occipital",
      "aliases": [],
      "hemi": "right",
      "label_id": 66
    },
    {
      "id": "rh_S_pericallosal",
      "name": "S_pericallosal",
      "color": "#B5DC14",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 67
    },
    {
      "id": "rh_S_postcentral",
      "name": "S_postcentral",
      "color": "#158CC8",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 68
    },
    {
      "id": "rh_S_precentral-inf-part",
      "name": "S_precentral-inf-part",
      "color": "#1514F0",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 69
    },
    {
      "id": "rh_S_precentral-sup-part",
      "name": "S_precentral-sup-part",
      "color": "#1514C8",
      "lobe": "frontal",
      "aliases": [],
      "hemi": "right",
      "label_id": 70
    },
    {
      "id": "rh_S_suborbital",
      "name": "S_suborbital",
      "color": "#15143C",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 71
    },
    {
      "id": "rh_S_subparietal",
      "name": "S_subparietal",
      "color": "#653C3C",
      "lobe": "parietal",
      "aliases": [],
      "hemi": "right",
      "label_id": 72
    },
    {
      "id": "rh_S_temporal_inf",
      "name": "S_temporal_inf",
      "color": "#15B4B4",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 73
    },
    {
      "id": "rh_S_temporal_sup",
      "name": "S_temporal_sup",
      "color": "#DFDC3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 74
    },
    {
      "id": "rh_S_temporal_transverse",
      "name": "S_temporal_transverse",
      "color": "#DD3C3C",
      "lobe": "temporal",
      "aliases": [],
      "hemi": "right",
      "label_id": 75
    }
  ],
  "yeo7": [
    {
      "id": "lh_7Networks_1",
      "name": "7Networks_1",
      "color": "#781286",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 1
    },
    {
      "id": "lh_7Networks_2",
      "name": "7Networks_2",
      "color": "#4682B4",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 2
    },
    {
      "id": "lh_7Networks_3",
      "name": "7Networks_3",
      "color": "#00760E",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 3
    },
    {
      "id": "lh_7Networks_4",
      "name": "7Networks_4",
      "color": "#C43AFA",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 4
    },
    {
      "id": "lh_7Networks_5",
      "name": "7Networks_5",
      "color": "#DCF8A4",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 5
    },
    {
      "id": "lh_7Networks_6",
      "name": "7Networks_6",
      "color": "#E69422",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 6
    },
    {
      "id": "lh_7Networks_7",
      "name": "7Networks_7",
      "color": "#CD3E4E",
      "lobe": "other",
      "aliases": [],
      "hemi": "left",
      "label_id": 7
    },
    {
      "id": "rh_7Networks_1",
      "name": "7Networks_1",
      "color": "#781286",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 1
    },
    {
      "id": "rh_7Networks_2",
      "name": "7Networks_2",
      "color": "#4682B4",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 2
    },
    {
      "id": "rh_7Networks_3",
      "name": "7Networks_3",
      "color": "#00760E",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 3
    },
    {
      "id": "rh_7Networks_4",
      "name": "7Networks_4",
      "color": "#C43AFA",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 4
    },
    {
      "id": "rh_7Networks_5",
      "name": "7Networks_5",
      "color": "#DCF8A4",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 5
    },
    {
      "id": "rh_7Networks_6",
      "name": "7Networks_6",
      "color": "#E69422",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 6
    },
    {
      "id": "rh_7Networks_7",
      "name": "7Networks_7",
      "color": "#CD3E4E",
      "lobe": "other",
      "aliases": [],
      "hemi": "right",
      "label_id": 7
    }
  ]
};

// 兼容旧代码：默认使用 HCP MMP 1.0
window.HCP_MMP_REGIONS_ATLAS = window.ATLAS_REGIONS.hcp_mmp;
