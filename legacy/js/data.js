/* ===== NeuroViz – HCP MMP 1.0 脑图谱 =====
 * Glasser et al. 2016, Nature
 * 每半球 180 区，共 360 个皮层分区
 * 表面: FreeSurfer fsaverage 高分辨率表面 (约 164k 顶点/半球)
 */

const CORTICAL_COLORS = (typeof ATLAS_REGIONS !== 'undefined'
    ? ATLAS_REGIONS.hcp_mmp.reduce((map, r) => { map[r.id] = r.color; return map; }, {})
    : {});

const HCP_MMP_REGIONS = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS.hcp_mmp : []);

if (typeof CORTICAL_COLORS !== 'undefined') window.CORTICAL_COLORS = CORTICAL_COLORS;
if (typeof HCP_MMP_REGIONS !== 'undefined') window.DESIKAN_REGIONS = HCP_MMP_REGIONS;
if (typeof HCP_MMP_REGIONS !== 'undefined') window.HCP_MMP_REGIONS = HCP_MMP_REGIONS;

// ===== 皮层下结构 =====
const SUBCORTICAL_STRUCTURES = [
    { id: 'ca1', name: 'CA1 海马', region: '海马体', color: '#E74C3C' },
    { id: 'ca2', name: 'CA2 海马', region: '海马体', color: '#EC7063' },
    { id: 'ca3', name: 'CA3 海马', region: '海马体', color: '#F1948A' },
    { id: 'ca4', name: 'CA4 海马', region: '海马体', color: '#F5B7B1' },
    { id: 'dg', name: '齿状回', region: '海马体', color: '#C0392B' },
    { id: 'amygdala', name: '杏仁核', region: '边缘系统', color: '#E91E63' },
    { id: 'thalamus_ant', name: '丘脑前核', region: '丘脑', color: '#9B59B6' },
    { id: 'thalamus_med', name: '丘脑内侧', region: '丘脑', color: '#8E44AD' },
    { id: 'thalamus_pul', name: '丘脑枕', region: '丘脑', color: '#AF7AC5' },
    { id: 'caudate', name: '尾状核', region: '基底节', color: '#3498DB' },
    { id: 'putamen', name: '壳核', region: '基底节', color: '#2E86C1' },
    { id: 'pallidum', name: '苍白球', region: '基底节', color: '#85C1E9' },
];

// ===== 小脑区域 =====
const CEREBELLAR_REGIONS = [
    { id: 'cereb_ant', name: '小脑前叶', region: '小脑', color: '#1ABC9C' },
    { id: 'cereb_post', name: '小脑后叶', region: '小脑', color: '#16A085' },
    { id: 'cereb_flocc', name: '绒球小结叶', region: '小脑', color: '#2ECC71' },
    { id: 'vermis', name: '小脑蚓部', region: '小脑', color: '#27AE60' },
    { id: 'cereb_hemi_L', name: '左小脑半球', region: '小脑', color: '#82E0AA' },
    { id: 'cereb_hemi_R', name: '右小脑半球', region: '小脑', color: '#A9DFBF' },
    { id: 'dentate', name: '齿状核', region: '小脑深部核团', color: '#58D68D' },
];

// ===== 白质/脑室结构 =====
const WHITE_MATTER_STRUCTURES = [
    { id: 'cc_genu', name: '胼胝体膝部', region: '胼胝体', color: '#F39C12' },
    { id: 'cc_body', name: '胼胝体体部', region: '胼胝体', color: '#E67E22' },
    { id: 'cc_splenium', name: '胼胝体压部', region: '胼胝体', color: '#D68910' },
    { id: 'lat_ventricle', name: '侧脑室', region: '脑室系统', color: '#7FB3D8' },
    { id: 'third_ventricle', name: '第三脑室', region: '脑室系统', color: '#5499C7' },
    { id: 'fourth_ventricle', name: '第四脑室', region: '脑室系统', color: '#2E86C1' },
];

window.SUBCORTICAL_STRUCTURES = SUBCORTICAL_STRUCTURES;
window.CEREBELLAR_REGIONS = CEREBELLAR_REGIONS;
window.WHITE_MATTER_STRUCTURES = WHITE_MATTER_STRUCTURES;