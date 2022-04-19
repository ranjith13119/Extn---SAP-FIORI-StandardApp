sap.ui.define([
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/FilterType",
	"nw/epm/refapps/purchaseorders/approve/controller/BaseController"
//	"nw/epm/refapps/purchaseorders/approve/model/models"
], function (Device, JSONModel, Filter, FilterOperator, FilterType, BaseController) {
	"use strict";
	return sap.ui.controller("nw.epm.refapps.purchaseorders.approve.ZSAMPLE_PO_APVExtension.controller.S2_PurchaseOrdersCustom", {
		    onInit: function () {
		        this._oApplication = this.getApplication();
		        this._oList = this.byId("poList");
		        this._oPullToRefresh = this.byId("pullToRefresh");
		        this._oListFilterState = { aSearch: [] };
		        this._iRunningListUpdates = 0;
		        this._initializeViewModel();
		        this._oApplication.oListSelector.setBoundMasterList(this._oList);
		        var sInitialProductId = this._getInitialFilterFromStartupParameters();
		        if (sInitialProductId) {
		            this.byId("searchField").setValue(sInitialProductId);
		            this.getRouter().attachEventOnce("routePatternMatched", this._setSearch.bind(this, sInitialProductId));
		        }
		    },
		    _initializeViewModel: function () {
		        this._oViewModel = new JSONModel({
		            itemCount: -1,
		            originalBusyDelayList: this._oList.getBusyIndicatorDelay()
		        });
		        this.setModel(this._oViewModel, "viewProperties");
		    },
		    _getInitialFilterFromStartupParameters: function () {
		        var oComponentData = this.getOwnerComponent().getComponentData();
		        if (oComponentData && oComponentData.startupParameters && jQuery.isArray(oComponentData.startupParameters.Product) && oComponentData.startupParameters.Product.length > 0) {
		            return oComponentData.startupParameters.Product[0];
		        }
		        return "";
		    },
		    onUpdateFinished: function () {
		        this._updateListItemCount();
		        this._oPullToRefresh.hide();
		        var oGlobalModel = this.getGlobalModel();
		        oGlobalModel.setProperty("/masterImmediateBusy", false);
		        if (Device.system.phone) {
		            oGlobalModel.setProperty("/detailImmediateBusy", false);
		        }
		        if (Device.system.phone || this._isMultiSelect() || oGlobalModel.getProperty("/currentPOId")) {
		            oGlobalModel.setProperty("/isBusyApproving", false);
		        } else {
		            this._findItemToDisplay();
		        }
		    },
		    _updateListItemCount: function () {
		        var iTotalItems = this._getListBinding().getLength();
		        this._oViewModel.setProperty("/itemCount", iTotalItems);
		        if (iTotalItems === 0) {
		            var sNoDataTextKey = this._oListFilterState.aSearch.length ? "masterListNoDataWithFilterOrSearchText" : "masterListNoDataText", oResourceBundle = this.getResourceBundle();
		            this.getGlobalModel().setProperty("/listNoDataText", oResourceBundle.getText(sNoDataTextKey));
		        }
		    },
		    _findItemToDisplay: function () {
		        var oGlobalProperties = this.getGlobalModel();
		        var aPreferredIds = oGlobalProperties.getProperty("/preferredIds");
		        oGlobalProperties.setProperty("/preferredIds", []);
		        var oNextItem = null;
		        for (var i = 0; i < aPreferredIds.length && !oNextItem; i++) {
		            oNextItem = this._getItemForId(aPreferredIds[i]);
		        }
		        oNextItem = oNextItem || this._oList.getItems()[0];
		        if (oNextItem) {
		            this._showDetail(oNextItem);
		        } else {
		            this._oApplication.showEmptyView("noObjects");
		        }
		    },
		    onSearch: function (oEvent) {
		        if (oEvent.getParameters().refreshButtonPressed) {
		            this.onRefresh();
		            return;
		        }
		        var sQuery = oEvent.getParameter("query");
		        this._setSearch(sQuery);
		        this._oApplication.whenMetadataIsFinished();
		    },
		    _setSearch: function (sQuery) {
		        if (sQuery) {
		            this._oListFilterState.aSearch = [new Filter({
		                    filters: [
		                        new Filter("SupplierName", FilterOperator.Contains, sQuery),
		                        new Filter("ProductId", FilterOperator.EQ, sQuery)
		                    ],
		                    and: false
		                })];
		        } else {
		            this._oListFilterState.aSearch = [];
		        }
		        this._getListBinding().filter(this._oListFilterState.aSearch, FilterType.Application);
		    },
		    onRefresh: function () {
		        this._oApplication.whenMetadataIsFinished(function (bSuccess) {
		            if (bSuccess) {
		                this._getListBinding().refresh();
		            } else {
		                this._oPullToRefresh.hide();
		            }
		        }.bind(this));
		    },
		    onSelectPressed: function (oEvent) {
		        var oListItem = oEvent.getParameter("listItem") || oEvent.getSource();
		        if (this._isMultiSelect()) {
		            if (this.getGlobalModel().getProperty("/isBusyApproving")) {
		                return;
		            }
		            this._itemCheckedChanged(oListItem);
		        } else {
		            this._showDetail(oListItem);
		        }
		    },
		    onMultiSelectPressed: function () {
		        var oGlobalProperties = this.getGlobalModel(), bMultiSelect = this._isMultiSelect();
		        if (bMultiSelect) {
		            if (!Device.system.phone) {
		                oGlobalProperties.setProperty("/preferredIds", [oGlobalProperties.getProperty("/currentPOId")]);
		                oGlobalProperties.setProperty("/currentPOId", null);
		            }
		            this._oList.removeSelections(true);
		            if (!Device.system.phone) {
		                this._showSummaryPage();
		            }
		        } else if (!Device.system.phone) {
		            this._oList.removeSelections(true);
		            this._findItemToDisplay();
		        }
		    },
		    onProcessPressed: function () {
		        this._showSummaryPage();
		    },
		    onNavButtonPressed: function () {
		    	alert("this is Back Button Navigation using the Controller Extention functionallity");
		        this._oApplication.navBack(true, false);
		    },
		    onSwipe: function (oEvent) {
		        if (this._isMultiSelect() || this.getGlobalModel().getProperty("/isBusyApproving") || this._oApplication.oApprover.isSwipeApproving(this._getIdForItem(oEvent.getParameter("listItem")))) {
		            oEvent.preventDefault();
		        }
		    },
		    onSwipeApprove: function () {
		        var aPOIds = [this._getIdForItem(this._oList.getSwipedItem())];
		        this._oApplication.oApprover.approve(true, true, this.getView(), aPOIds, "");
		        this._oList.swipeOut();
		    },
		    _showDetail: function (oItem) {
		        var bReplace = !Device.system.phone, aTarget = [
		                "detail",
		                "master"
		            ];
		        oItem.setSelected(true);
		        this.getRouter().getTargets().display(aTarget);
		        this.getRouter().navTo("PurchaseOrderDetails", { POId: encodeURIComponent(this._getIdForItem(oItem)) }, bReplace);
		    },
		    _isMultiSelect: function () {
		        return this.getGlobalModel().getProperty("/isMultiSelect");
		    },
		    _showSummaryPage: function () {
		        var aTarget = [
		            "master",
		            "summary"
		        ];
		        this.getRouter().getTargets().display(aTarget);
		    },
		    _itemCheckedChanged: function (oListItem) {
		        var bIsSelected = oListItem.getSelected(), oGlobalProperties = this.getGlobalModel(), aPurchaseOrders = oGlobalProperties.getProperty("/selectedPurchaseOrders").slice(0);
		        if (bIsSelected) {
		            var oPurchaseOrder = this.getModel().getObject(oListItem.getBindingContextPath());
		            aPurchaseOrders.push(oPurchaseOrder);
		        } else {
		            var sCurrentPOId = this._getIdForItem(oListItem);
		            for (var i = 0; i < aPurchaseOrders.length; i++) {
		                if (aPurchaseOrders[i].POId === sCurrentPOId) {
		                    aPurchaseOrders.splice(i, 1);
		                    break;
		                }
		            }
		        }
		        oGlobalProperties.setProperty("/selectedPurchaseOrders", aPurchaseOrders);
		    },
		    _getListBinding: function () {
		        return this._oList.getBinding("items");
		    },
		    _getItemForId: function (sPOId) {
		        var aItems = this._oList.getItems();
		        for (var i = 0; i < aItems.length; i++) {
		            if (sPOId === this._getIdForItem(aItems[i])) {
		                return aItems[i];
		            }
		        }
		    },
		    _getIdForItem: function (oListItem) {
		        return oListItem.getBindingContext().getProperty("POId");
		    }
	});
});