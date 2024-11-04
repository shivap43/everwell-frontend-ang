function pegaScript() {
  pega.web.mgr._initGadgets = function(oWin) {
    var p_w_window = oWin;
    var oDoc = oWin.document;
    // Collect all DIVs containing Pega gadgets and initialize gadget manager objects.
    // Do not execute gadget default actions yet. This way manager will be aware of all
    // present gadgets in case any default action causes cross-gadget behavior.
    var colDivs;
    if (typeof jQuery == "undefined") {
      colDivs = window.document.querySelectorAll("DIV,IFRAME");
    } else {
      colDivs = $(
        "DIV[PegaGadget],DIV[data-pega-gadgetname],IFRAME[PegaGadget],IFRAME[data-pega-iframe-gadgetname]"
      );
    }

    var htNewGadgets = new pega.tools.Hashtable();
    //		var o1div = null;
    for (var i = 0; i < colDivs.length; ++i) {
      var oEl = colDivs[i];
      // BUG-79132 GUJAS1 11/02/2012 Replaced attributes[] by call to getAttribute, which is faster.
      var gadgetName =
        oEl.getAttribute("PegaGadget") ||
        oEl.getAttribute("data-pega-gadgetname") ||
        oEl.getAttribute("data-pega-iframe-gadgetname");

      if (gadgetName != null) {
        var sGdtId = gadgetName;
        try {
          var oGt = this._htGadgets.get(sGdtId);
          if (oGt != null && oGt._oWin == oWin) continue; // prevent duplicate initialization.
        } catch (e) {}
        this._initGadget(oEl, p_w_window);
        htNewGadgets.put(sGdtId, sGdtId);
      }
    }

    // Issue http requests for gadgets whose default action requires navigation.
    var keys = htNewGadgets.keys();
    keys.forEach(function(key) {
      var oGt = this._htGadgets.get(key);
      if (pega.web.isWebMashup) {
        if (oGt._bIsIframeOnly) oGt._doAttrAction();
        else if (oGt._oConfigDefs.tenantID == "") {
          oGt._oConfigDefs.serverURLWithHash = oGt._oConfigDefs.serverURL;
          if (oGt._oDivAttrs.action != "") {
            if (oGt._oDivAttrs.defer == "false") {
              oGt._doAttrAction();
            }
          }
        } else if (
          pega.web.serverURLsMap[oGt._oConfigDefs.serverURL] &&
          pega.web.serverURLsMap[oGt._oConfigDefs.serverURL][
            oGt._oConfigDefs.tenantID
          ]
        ) {
          oGt._oConfigDefs.serverURLWithHash =
            pega.web.serverURLsMap[oGt._oConfigDefs.serverURL][
              oGt._oConfigDefs.tenantID
            ];
          if (oGt._oDivAttrs.action != "") {
            if (oGt._oDivAttrs.defer == "false") {
              oGt._doAttrAction();
            }
          }
        } else {
          var defaultAppUrl = _getDefaultAppUrl(
            oGt._oConfigDefs.serverURL || pega.web.config.gatewayURL
          );
          var url =
            defaultAppUrl +
            "?pyActivity=pzGetURLHashes&TenantName=" +
            oGt._oConfigDefs.tenantID;
          this._loadScript(url, function() {
            pega.web.serverURLsMap[oGt._oConfigDefs.serverURL] =
              pega.web.serverURLsMap[oGt._oConfigDefs.serverURL] || {};
            pega.web.serverURLsMap[oGt._oConfigDefs.serverURL][
              oGt._oConfigDefs.tenantID
            ] = oGt._oConfigDefs.serverURL + pega.web.config.tempAGHash;
            oGt._oConfigDefs.serverURLWithHash =
              oGt._oConfigDefs.serverURL + pega.web.config.tempAGHash;
            delete pega.web.config.tempAGHash;
            if (oGt._oDivAttrs.action != "") {
              if (oGt._oDivAttrs.defer == "false") {
                oGt._doAttrAction();
              }
            }
          });
        }
      } else {
        if (oGt._oDivAttrs.action != "") {
          if (oGt._oDivAttrs.defer == "false") {
            oGt._doAttrAction();
          }
        }
      }
    }, this);
  };
}
