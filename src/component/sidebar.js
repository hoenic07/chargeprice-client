import ManageMyTariffs from './manage_my_tariffs';
import MyVehicle from './my_vehicle';
import StationPrices from './station_prices';
import RoutePlanner from '../views/routePlanner';
import ViewBase from './viewBase';


export default class Sidebar extends ViewBase {

  constructor(depts) {
    super(depts);
    this.depts = depts;
    this.translation= depts.translation();
    this.analytics = depts.analytics();
    this.urlModifier = depts.urlModifier();
    this.settingsPrimitive=depts.settingsPrimitive();
    this.customConfig = depts.customConfig();
    this.currency = depts.currency();
    this.manageMyTariffs = new ManageMyTariffs(this,depts);
    this.myVehicle = new MyVehicle(this,this.depts);
    this.stationPrices = new StationPrices(this,this.depts);
    this.routePlanner = new RoutePlanner(this,this.depts);
    this.loaded = false;
    this.rootId = "sidebar";

    this.sidebarContent = {
      "settings": {
        header: this.translation.get("settingsHeader"),
        contentId: "settingsContent"
      },
      "info": {
        header: this.translation.get("infoHeader"),
        contentId: "infoContent"
      },
      "prices": {
        header: this.translation.get("pricesHeader"),
        contentId: "pricesContent",
        onClosed: ()=>this.urlModifier.resetUrl()
      },
      "manageMyTariffs": {
        header: this.translation.get("manageMyTariffsHeader"),
        contentId: "manageMyTariffsContent",
        onClosed: ()=>this.optionsChanged(),
        onOpen: ()=>this.manageMyTariffs.render()
      },
      "route": {
        header: "Route Planner",
        contentId: "routeContent",
        onOpen: ()=>this.routePlanner.render()
      },
    };

    this.currentSidebarContentKey = null;
    
    this.close();
    this.hideAllSidebarContent();

    this.loaded = true;
  }

  chargingOptions(){
    const settingsModel = this.settingsView.getModel();
    return {
      duration: 0,
      kwh: 0,
      minPower: settingsModel.minPower,
      onlyFree: settingsModel.onlyFree,
      openNow: settingsModel.openNow,
      carACPhases: 3,
      providerCustomerTariffs: settingsModel.providerCustomerTariffs,
      onlyShowMyTariffs: settingsModel.onlyShowMyTariffs,
      allowUnbalancedLoad: !this.translation.showUnbalancedLoad() || settingsModel.allowUnbalancedLoad,
      onlyTariffsWithoutMonthlyFees: settingsModel.onlyTariffsWithoutMonthlyFees,
      batteryRange: this.stationPrices.getBatteryRange(),
      myTariffs: this.manageMyTariffs.getMyTariffs(),
      myVehicle: this.myVehicle.getVehicle(),
      displayedCurrency: this.currency.getDisplayedCurrency(),
      startTime: this.stationPrices.getStartTime(),
      chargePoint: this.stationPrices.getCurrentChargePoint()
    }
  }

  showSettingsOnStart(){
    const isMobileOrTablet = this.customConfig.isMobileOrTablet();
    const isFirstAppStart = this.settingsPrimitive.getAppStartCount() == 1;

    if(isMobileOrTablet && !isFirstAppStart) return;
    this.open("settings");
  }

  showStation(station){
    this.stationPrices.showStation(station);

    this.open("prices");    
  }

  updateStationPrice(station,prices,options){
    this.stationPrices.updateStationPrice(station,prices,options)
  }

  onOptionsChanged(callback){
    this.optionsChangedCallback = callback;
  }

  optionsChanged(){
    if(this.optionsChangedCallback) this.optionsChangedCallback();
  }

  open(contentKey) {
    this.analytics.log('send', 'event', 'Sidebar', 'open', contentKey); 

    this.show(this.rootId)

    const content = this.sidebarContent[contentKey];
    this.getEl("sidebarHeader").innerText = content.header;

    this.hideOldContent();
    this.show(content.contentId);
    this.currentSidebarContentKey = contentKey;
    if(content.onOpen) content.onOpen();
  }

  close() {
    this.hide(this.rootId)
    this.hideOldContent();
  }

  hideOldContent(){
    if (this.currentSidebarContentKey) {
      const oldContent = this.sidebarContent[this.currentSidebarContentKey];
      this.hide(oldContent.contentId);
      if(oldContent.onClosed) oldContent.onClosed();
      this.currentSidebarContentKey=null;
    }
  }

  hideAllSidebarContent() {
    for (var key in this.sidebarContent) {
      const content = this.sidebarContent[key];
      this.hide(content.contentId);
    }
  }
}