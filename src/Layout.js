export default class Layout {
  constructor() {
    this.onResize();
    this.bindEvents();
  }
  
  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
  }
  
  onResize() {
    this.isMobile = window.matchMedia('(max-width: 767px)').matches;
    this.isSmallMobile = window.matchMedia('(max-width: 400px)').matches;
    
    this.W = window.innerWidth;
    this.H = window.innerHeight;
  }
}
