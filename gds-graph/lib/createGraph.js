module.exports = function createGraph(datastore) {
  const pendingNodes = [];
  const pendingTimeStamps = [];

  return {
    addNode,
    addLink,
    save
  };

  function addNode(kind, id, data) {
    pendingNodes.push({
      key: datastore.key([kind, id, 'data', 'default']),
      data
    });

    pendingTimeStamps.push({
      key: datastore.key([kind, id]),
      data: {
        timestamp: new Date()
      }
    });
  }

  function addLink(from, verb, to) {
    const transaction = datastore.transaction();
    const fromId = from.join('.');
    const toId = to.join('.');

    return transaction.run()
      .then(() => {
        var query = transaction.createQuery('edges')
          .filter('fromId', '=', fromId)
          .filter('verb', '=', verb)
          .filter('toId', '=', toId);

        return datastore.runQuery(query);
      })
      .then((results) => {
        const edges = results && results[0];
        console.log('edge creation results', edges);
        const edgeData = {
          fromId,
          verb,
          toId,
          timestamp: new Date()
        };

        if (edges.length > 0) {
          // edge already exist
          console.log('edge already exist', edgeData);
          return transaction.rollback();
        }
        console.log('Creating edge', edgeData);
        transaction.save({
          key: datastore.key(['edges']),
          data: edgeData
        });

        return transaction.commit();
      });
  }

  function save() {
    datastore.save(pendingNodes).then((res) => {
      console.log('all nodes saved', res);
    });

    const ts = Promise.all(pendingTimeStamps.map(timeStampUpdate => {
      const transaction = datastore.transaction();

      return transaction.run()
        .then(() => {
          let res = transaction.get(timeStampUpdate.key)
          console.log('then', res);
          return res;
        })
        .then((results) => {
          console.log('then ', results);
          const task = results && results[0];
          console.log('task', task);
          if (task) {
            // The task entity already exists.
            return transaction.rollback();
          } else {
            // Create the task entity.
            console.log('creating', timeStampUpdate.data);
            transaction.save(timeStampUpdate);
            return transaction.commit();
          }
        })
        .catch((e) => {
          console.log('Failed to run transaction', e);
          transaction.rollback()
        });
    }));

    ts.then(() => {
      console.log('time stamp is updated');
    });
  }

};
