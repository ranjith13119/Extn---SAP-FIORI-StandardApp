jQuery.sap.declare("nw.epm.refapps.purchaseorders.approve.ZSAMPLE_PO_APVExtension.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "nw.epm.refapps.purchaseorders.approve",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/ZSAMPLE_PO_APV"
		// we use a URL relative to our own component
		// extension application is deployed with customer namespace
});

this.nw.epm.refapps.purchaseorders.approve.Component.extend("nw.epm.refapps.purchaseorders.approve.ZSAMPLE_PO_APVExtension.Component", {
	metadata: {
		manifest: "json"
	}
});